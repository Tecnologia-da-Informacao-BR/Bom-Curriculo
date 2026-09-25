import asyncio
import json
import time
from pathlib import Path

import pytest

from app.core.settings import AISettings, ServerSettings, Settings
from app.models.resume_analysis import (
    BuiltResumeResult,
    ResumeAnalysisRequest,
    ResumeScoreResult,
    ResumeSkillItem,
    SkillItem,
)
from app.providers.base import AIProviderError
from app.providers.mock import MockProvider
from app.services.ai.resume_analysis_manager import ResumeAnalysisManager

RESUME_TEXT = "COMPETÊNCIAS\nPython, FastAPI, SQL."


@pytest.fixture(autouse=True)
def load_example_configuration(monkeypatch) -> None:
    # Keep tests independent of the developer's untracked config.yaml.
    load = Settings.load
    config_path = Path(__file__).resolve().parents[1] / "config.yaml.example"
    monkeypatch.setattr(Settings, "load", staticmethod(lambda: load(config_path)))


@pytest.fixture
def build_with_ai_result(monkeypatch):
    monkeypatch.setenv("IA_PROVIDER", "mock")

    def build(ai_result: BuiltResumeResult, **known_facts) -> BuiltResumeResult:
        return asyncio.run(
            ResumeAnalysisManager().build_resume(
                RESUME_TEXT,
                lambda _name: MockProvider(structured_response=ai_result),
                **known_facts,
            )
        )

    return build


def make_score(score: int = 70) -> ResumeScoreResult:
    return ResumeScoreResult(score=score, suggestion="Adicione métricas de impacto.")


def make_built() -> BuiltResumeResult:
    return BuiltResumeResult(personal={"location": {}})


class ProviderFake(MockProvider):
    def __init__(self, name: str, should_fail: bool = False, prompts: list | None = None):
        super().__init__(model=f"modelo-{name}", structured_response=make_built())
        self.name = name
        self.should_fail = should_fail
        self._prompts = prompts

    async def run_structured(self, prompt, schema, temperature=0.2):
        if self._prompts is not None:
            self._prompts.append((self.name, prompt))
        if self.should_fail:
            raise AIProviderError(f"Falha simulada de {self.name}")
        return await super().run_structured(prompt, schema, temperature)


def configure_keys(monkeypatch):
    for name in ("GROQ", "GEMINI", "DEEPSEEK", "OPENAI"):
        monkeypatch.setenv(f"{name}_API_KEY", "chave-ficticia-para-teste")


def test_uses_first_configured_provider_in_chain(monkeypatch) -> None:
    configure_keys(monkeypatch)
    monkeypatch.setenv("IA_PROVIDER", "auto")
    monkeypatch.setenv("IA_PROVIDER_CHAIN", "groq,gemini")
    calls = []

    result = asyncio.run(
        ResumeAnalysisManager().build_resume(
            RESUME_TEXT, lambda name: calls.append(name) or ProviderFake(name)
        )
    )

    assert calls == ["groq"]
    assert result == make_built()


def test_falls_back_to_next_provider_on_failure(monkeypatch) -> None:
    configure_keys(monkeypatch)
    monkeypatch.setenv("IA_PROVIDER", "auto")
    monkeypatch.setenv("IA_PROVIDER_CHAIN", "groq,gemini")

    result = asyncio.run(
        ResumeAnalysisManager().build_resume(
            RESUME_TEXT, lambda name: ProviderFake(name, should_fail=name == "groq")
        )
    )

    assert isinstance(result, BuiltResumeResult)


def test_skips_providers_without_configuration(monkeypatch) -> None:
    monkeypatch.setenv("IA_PROVIDER", "auto")
    monkeypatch.setenv("IA_PROVIDER_CHAIN", "groq,gemini")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "chave-ficticia-para-teste")
    calls = []

    result = asyncio.run(
        ResumeAnalysisManager().build_resume(
            RESUME_TEXT, lambda name: calls.append(name) or ProviderFake(name)
        )
    )

    assert calls == ["gemini"]
    assert isinstance(result, BuiltResumeResult)


def test_raises_when_every_provider_fails(monkeypatch) -> None:
    configure_keys(monkeypatch)
    monkeypatch.setenv("IA_PROVIDER", "auto")
    monkeypatch.setenv("IA_PROVIDER_CHAIN", "groq,gemini")

    with pytest.raises(AIProviderError):
        asyncio.run(
            ResumeAnalysisManager().build_resume(
                RESUME_TEXT, lambda name: ProviderFake(name, should_fail=True)
            )
        )


def test_invalid_structured_response_tries_next_provider(monkeypatch) -> None:
    configure_keys(monkeypatch)
    monkeypatch.setenv("IA_PROVIDER", "auto")
    monkeypatch.setenv("IA_PROVIDER_CHAIN", "groq,gemini")
    calls = []

    def factory(name):
        calls.append(name)
        if name == "groq":
            return MockProvider(structured_response=None)
        return ProviderFake(name)

    result = asyncio.run(ResumeAnalysisManager().build_resume(RESUME_TEXT, factory))

    assert calls == ["groq", "gemini"]
    assert isinstance(result, BuiltResumeResult)


@pytest.mark.parametrize("selected,forbidden", [("groq", "deepseek"), ("deepseek", "groq")])
def test_pinned_provider_never_calls_others(monkeypatch, selected, forbidden) -> None:
    configure_keys(monkeypatch)
    monkeypatch.setenv("IA_PROVIDER", selected)
    calls = []

    asyncio.run(
        ResumeAnalysisManager().build_resume(
            RESUME_TEXT, lambda name: calls.append(name) or ProviderFake(name)
        )
    )

    assert calls == [selected]
    assert forbidden not in calls


@pytest.mark.parametrize(
    "category,status",
    [
        ("auth_error_401", 401),
        ("permission_error_403", 403),
        ("rate_limit_429", 429),
        ("timeout", None),
    ],
)
def test_provider_failure_is_sanitized(monkeypatch, category, status) -> None:
    monkeypatch.setenv("IA_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "chave-ficticia-para-teste")

    class FailingProvider(ProviderFake):
        async def run_structured(self, prompt, schema, temperature=0.2):
            raise AIProviderError("detail interno que não deve sair", category=category, status_http=status)

    with pytest.raises(AIProviderError) as captured:
        asyncio.run(
            ResumeAnalysisManager().build_resume(RESUME_TEXT, lambda name: FailingProvider(name))
        )

    assert captured.value.category == category
    assert captured.value.status_http == status
    assert "detail interno" not in str(captured.value)


def test_provider_failure_logs_original_exception_but_returns_sanitized_error(
    monkeypatch, caplog
) -> None:
    monkeypatch.setenv("IA_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "chave-ficticia-para-teste")

    class FailingProvider(ProviderFake):
        async def run_structured(self, prompt, schema, temperature=0.2):
            raise AIProviderError(
                "internal provider diagnostic 5c72",
                category="network_error",
            )

    with caplog.at_level("WARNING", logger="app.services.ai.resume_analysis_manager"):
        with pytest.raises(AIProviderError) as captured:
            asyncio.run(
                ResumeAnalysisManager().build_resume(
                    RESUME_TEXT, lambda name: FailingProvider(name)
                )
            )

    assert str(captured.value) == "Could not connect to Groq."
    assert "internal provider diagnostic 5c72" not in str(captured.value)
    assert "internal provider diagnostic 5c72" in caplog.text
    assert caplog.records[-1].provider_name == "groq"
    assert caplog.records[-1].error_category == "network_error"
    assert caplog.records[-1].model_name == "openai/gpt-oss-120b"


def test_total_inference_deadline_cancels_active_generation_and_is_sanitized(caplog) -> None:
    settings = Settings(
        server=ServerSettings(host="127.0.0.1", port=8000, log_level="INFO"),
        ai=AISettings(
            enabled_by_default=True,
            output_language="pt-BR",
            provider="mock",
            provider_chain=("mock",),
            inference_deadline_seconds=0.02,
        ),
    )
    was_cancelled = False

    class SlowProvider(MockProvider):
        async def run_structured(self, prompt, schema, temperature=0.2):
            nonlocal was_cancelled
            try:
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                was_cancelled = True
                raise
            return make_built()

    started_at = time.monotonic()
    with caplog.at_level("WARNING", logger="app.services.ai.resume_analysis_manager"):
        with pytest.raises(AIProviderError) as captured:
            asyncio.run(
                ResumeAnalysisManager(settings=settings).build_resume(
                    RESUME_TEXT, lambda _name: SlowProvider()
                )
            )

    assert time.monotonic() - started_at < 0.5
    assert was_cancelled is True
    assert captured.value.category == "timeout"
    assert str(captured.value) == "AI inference exceeded the time limit."
    assert captured.value.__cause__ is not None
    assert "AI inference deadline exceeded." in caplog.text


@pytest.mark.parametrize("ai_github", [None, "https://github.com/ai-guess"])
@pytest.mark.parametrize("ai_portfolio", [None, "https://ai-guess.example.test"])
def test_merges_github_and_portfolio_into_personal_regardless_of_ai_output(
    build_with_ai_result, ai_github, ai_portfolio
) -> None:
    """Known-exact values must land correctly even if the AI ignores/misplaces them."""
    ai_result = BuiltResumeResult(
        personal={
            "location": {},
            "linkedin": "https://linkedin.com/in/verified-user",
            "github": ai_github,
            "portfolio": ai_portfolio,
        }
    )

    result = build_with_ai_result(
        ai_result,
        github_url="https://github.com/pedroaruana",
        portfolio_url="https://pedroaruana.dev",
    )

    assert result is ai_result
    assert result.personal.github == "https://github.com/pedroaruana"
    assert result.personal.portfolio == "https://pedroaruana.dev"
    assert result.personal.linkedin == "https://linkedin.com/in/verified-user"


@pytest.mark.parametrize(
    "github_url,portfolio_url",
    [
        (None, None),
        ("", ""),
        ("https://github.com/verified-user", None),
        (None, "https://verified-user.example.test"),
    ],
)
def test_missing_external_links_preserve_existing_personal_links(
    build_with_ai_result, github_url, portfolio_url
) -> None:
    ai_result = BuiltResumeResult(
        personal={
            "location": {},
            "github": "https://github.com/existing-user",
            "portfolio": "https://existing-user.example.test",
        }
    )
    expected = ai_result.model_dump(mode="json")
    if github_url:
        expected["personal"]["github"] = github_url
    if portfolio_url:
        expected["personal"]["portfolio"] = portfolio_url

    result = build_with_ai_result(
        ai_result, github_url=github_url, portfolio_url=portfolio_url
    )

    assert result.model_dump(mode="json") == expected


def test_merges_additional_skills_without_duplicating_existing_ones(build_with_ai_result) -> None:
    ai_result = BuiltResumeResult(
        personal={"location": {}},
        skills=[
            ResumeSkillItem(title="Python", years=2.5, level="Advanced"),
            ResumeSkillItem(title="docker", years=1, level="Intermediate"),
        ],
    )
    request = ResumeAnalysisRequest(
        resume_cv=b"resume",
        additional_skills=[
            {"name": " Docker ", "years": 3},
            {"name": "GraphQL", "years": 1},
            {"name": " graphql ", "years": 2},
        ],
    )
    original_input = request.model_dump()

    result = build_with_ai_result(ai_result, additional_skills=request.additional_skills)

    assert result.model_dump(mode="json")["skills"] == [
        {"title": "Python", "years": 2.5, "level": "Advanced"},
        {"title": "docker", "years": 3, "level": "Intermediate"},
        {"title": "GraphQL", "years": 2, "level": None},
    ]
    assert all(isinstance(skill, ResumeSkillItem) for skill in result.skills)
    assert all("name" not in skill.model_dump(mode="json") for skill in result.skills)
    assert all(isinstance(skill, SkillItem) for skill in request.additional_skills)
    assert request.model_dump() == original_input


@pytest.mark.parametrize("reported_name", ["PHP", "php", "\t pHp \n"])
@pytest.mark.parametrize("reported_years,expected_years", [(5, 5), (0, 0), (None, 2.5)])
def test_additional_skill_years_override_only_when_reported_and_preserve_ai_title_and_level(
    build_with_ai_result, caplog, reported_name, reported_years, expected_years
) -> None:
    ai_result = BuiltResumeResult(
        personal={"location": {}},
        skills=[ResumeSkillItem(title=" PhP ", years=2.5, level="Advanced")],
    )
    original_skill = ai_result.skills[0]

    result = build_with_ai_result(
        ai_result,
        additional_skills=[SkillItem(name=reported_name, years=reported_years)],
    )

    assert len(result.skills) == 1
    assert result.skills[0] is original_skill
    assert result.skills[0].model_dump(mode="json") == {
        "title": " PhP ",
        "years": expected_years,
        "level": "Advanced",
    }
    assert not caplog.records


@pytest.mark.parametrize(
    "unreported_skill",
    [{"name": "GraphQL"}, {"name": "GraphQL", "years": None}],
)
def test_missing_skill_without_years_is_skipped_with_warning_and_merge_continues(
    build_with_ai_result, caplog, unreported_skill
) -> None:
    ai_result = BuiltResumeResult(
        personal={"location": {}},
        skills=[ResumeSkillItem(title="PHP", years=2.5, level="Advanced")],
    )
    request = ResumeAnalysisRequest(
        resume_cv=b"resume",
        additional_skills=[
            unreported_skill,
            {"name": "Python", "years": 0},
            {"name": "Docker", "years": 3},
            {"name": " php ", "years": None},
        ],
    )
    original_input = request.model_dump()

    with caplog.at_level("WARNING", logger="app.services.ai.resume_analysis_manager"):
        result = build_with_ai_result(ai_result, additional_skills=request.additional_skills)

    assert result is ai_result
    assert result.model_dump(mode="json")["skills"] == [
        {"title": "PHP", "years": 2.5, "level": "Advanced"},
        {"title": "Python", "years": 0, "level": None},
        {"title": "Docker", "years": 3, "level": None},
    ]
    assert request.model_dump() == original_input
    assert BuiltResumeResult.model_validate_json(result.model_dump_json()) == result
    assert len(caplog.records) == 1
    assert caplog.records[0].levelname == "WARNING"
    assert caplog.records[0].getMessage() == (
        "Additional skill 'GraphQL' was not added to the structured resume "
        "because years is null; the output contract requires a number."
    )


def test_skipping_only_additional_skill_without_years_keeps_empty_result_valid(
    build_with_ai_result, caplog
) -> None:
    ai_result = make_built()
    expected = ai_result.model_dump(mode="json")

    with caplog.at_level("WARNING", logger="app.services.ai.resume_analysis_manager"):
        result = build_with_ai_result(
            ai_result, additional_skills=[SkillItem(name="Python", years=None)]
        )

    assert result is ai_result
    assert result.model_dump(mode="json") == expected
    assert len(caplog.records) == 1
    assert "Additional skill 'Python' was not added" in caplog.records[0].getMessage()


def test_skill_without_ai_title_is_preserved_when_adding_a_known_skill(build_with_ai_result) -> None:
    ai_result = BuiltResumeResult(
        personal={"location": {}},
        skills=[ResumeSkillItem(title=None, years=2, level="Intermediate")],
    )

    result = build_with_ai_result(
        ai_result, additional_skills=[SkillItem(name="Python", years=3)]
    )

    assert result.model_dump(mode="json")["skills"] == [
        {"title": None, "years": 2, "level": "Intermediate"},
        {"title": "Python", "years": 3, "level": None},
    ]


@pytest.mark.parametrize("additional_skills", [None, []])
def test_no_known_facts_preserves_validated_ai_result(build_with_ai_result, additional_skills) -> None:
    ai_result = make_built()
    expected = ai_result.model_dump(mode="json")

    result = build_with_ai_result(ai_result, additional_skills=additional_skills)

    assert result is ai_result
    assert result.model_dump(mode="json") == expected


def test_merge_preserves_all_other_ai_data_and_the_new_output_contract(build_with_ai_result) -> None:
    path = (
        Path(__file__).resolve().parents[2]
        / "backend/tests/Fixtures/bot_resume_payload.json"
    )
    ai_result = BuiltResumeResult.model_validate_json(path.read_text(encoding="utf-8"))
    expected = ai_result.model_dump(mode="json")
    expected["personal"]["github"] = "https://github.com/verified-user"
    expected["personal"]["portfolio"] = "https://verified-user.example.test"
    expected["skills"][0]["years"] = 7
    expected["skills"].append({"title": "Python", "years": 3, "level": None})

    result = build_with_ai_result(
        ai_result,
        github_url="https://github.com/verified-user",
        portfolio_url="https://verified-user.example.test",
        additional_skills=[
            SkillItem(name=ai_result.skills[0].title, years=7),
            SkillItem(name="Python", years=3),
        ],
    )

    actual = result.model_dump(mode="json")
    assert result is ai_result
    assert actual == expected
    assert set(actual) == {
        "personal", "professional_summary", "target_role", "skills", "experiences",
        "education", "courses", "languages", "projects", "certifications",
        "additional_informations",
    }
    assert {"header", "qualifications", "others", "score"}.isdisjoint(actual)
    assert BuiltResumeResult.model_validate_json(json.dumps(actual)) == result


def test_score_resume_uses_first_configured_provider_in_chain(monkeypatch) -> None:
    configure_keys(monkeypatch)
    monkeypatch.setenv("IA_PROVIDER", "auto")
    monkeypatch.setenv("IA_PROVIDER_CHAIN", "groq,gemini")
    calls = []

    def factory(name):
        calls.append(name)
        return MockProvider(structured_response=make_score(85))

    result = asyncio.run(ResumeAnalysisManager().score_resume(RESUME_TEXT, factory))

    assert calls == ["groq"]
    assert isinstance(result, ResumeScoreResult)
    assert result.score == 85


def test_score_resume_falls_back_to_next_provider_on_failure(monkeypatch) -> None:
    configure_keys(monkeypatch)
    monkeypatch.setenv("IA_PROVIDER", "auto")
    monkeypatch.setenv("IA_PROVIDER_CHAIN", "groq,gemini")

    def factory(name):
        if name == "groq":
            return MockProvider(simulated_error=AIProviderError("boom"))
        return MockProvider(structured_response=make_score())

    result = asyncio.run(ResumeAnalysisManager().score_resume(RESUME_TEXT, factory))

    assert isinstance(result, ResumeScoreResult)
