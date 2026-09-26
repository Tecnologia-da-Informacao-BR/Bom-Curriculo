"""Tests for POST /api/v1/build — reconstructing the best possible ATS resume."""

import asyncio
import json

import pytest
from dependency_injector import providers
from httpx import ASGITransport, AsyncClient

from app.core.settings import Settings
from app.main import app
from app.models.github_profile import GitHubProfile
from app.models.resume_analysis import BuiltResumeResult, ResumeScoreResult

BASE_RESUME_TEXT = (
    "Desenvolvedor backend com experiência em Python, FastAPI e SQL. Atuou em "
    "projetos de automação de currículos, integração com filas de mensagens e "
    "construção de APIs REST para times de produto. Formação em Ciência da "
    "Computação e experiência prévia como estagiário de TI."
)
LINKEDIN_TEXT = "Experiência complementar fornecida pelo LinkedIn."


class FakeDocumentReaderAggregator:
    def read(self, content: bytes, filename: str) -> str:
        return LINKEDIN_TEXT if filename == "linkedin.pdf" else BASE_RESUME_TEXT


class FakeGitHubProfileFetcher:
    async def fetch_profile(self, github_url: str) -> GitHubProfile:
        return GitHubProfile(username="pedroaruana", name="Perfil GitHub verificado")


@pytest.fixture
def build_dependencies(monkeypatch, stub_chat_model, resume_payload):
    """Keep the real controller, manager, factory, provider and merge in the test."""
    monkeypatch.setenv("IA_PROVIDER", "ollama")
    stub_chat_model._result = resume_payload
    with (
        app.container.settings.override(providers.Object(Settings.load())),
        app.container.document_reader_aggregator.override(
            providers.Object(FakeDocumentReaderAggregator())
        ),
        app.container.github_profile_fetcher.override(
            providers.Object(FakeGitHubProfileFetcher())
        ),
    ):
        yield stub_chat_model


async def request_app(method: str, path: str, **parameters):
    """Call the ASGI application without an external server."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, **parameters)


def test_build_endpoint_returns_built_resume(build_dependencies, resume_payload) -> None:
    response = asyncio.run(
        request_app(
            "POST",
            "/api/v1/build",
            files={"resume_cv": ("cv.pdf", b"irrelevant, reader is faked", "application/pdf")},
        )
    )

    assert response.status_code == 200
    result = response.json()
    assert result == resume_payload
    assert set(result) == {
        "personal",
        "professional_summary",
        "target_role",
        "skills",
        "experiences",
        "education",
        "courses",
        "languages",
        "projects",
        "certifications",
        "additional_informations",
    }
    assert {"score", "header", "qualifications", "others", "suggestion"}.isdisjoint(result)
    assert BuiltResumeResult.model_validate(result).model_dump(mode="json") == result
    assert build_dependencies.structured_schema is BuiltResumeResult
    assert len(build_dependencies.prompts) == 1
    assert BASE_RESUME_TEXT in build_dependencies.prompts[0]


def test_build_endpoint_rejects_missing_resume_cv(build_dependencies) -> None:
    response = asyncio.run(
        request_app("POST", "/api/v1/build", data={"github_url": "https://github.com/foo"})
    )

    assert response.status_code == 422
    assert build_dependencies.prompts == []


def test_build_endpoint_forwards_every_supporting_source(build_dependencies, resume_payload) -> None:
    known_skills = [
        {"name": resume_payload["skills"][0]["title"].lower(), "years": 8},
        {"name": "React", "years": 2},
        {"name": "GraphQL", "years": None},
    ]
    response = asyncio.run(
        request_app(
            "POST",
            "/api/v1/build",
            data={
                "github_url": "https://github.com/pedroaruana",
                "portfolio_url": "https://pedroaruana.dev",
                "additional_skills": json.dumps(known_skills),
            },
            files={
                "resume_cv": ("cv.pdf", b"CV source", "application/pdf"),
                "resume_linkedin": ("linkedin.pdf", b"LinkedIn source", "application/pdf"),
            },
        )
    )

    assert response.status_code == 200
    # These changes prove that the real manager applied _merge_known_facts.
    expected = BuiltResumeResult.model_validate(resume_payload).model_dump(mode="json")
    expected["personal"]["github"] = "https://github.com/pedroaruana"
    expected["personal"]["portfolio"] = "https://pedroaruana.dev"
    expected["skills"][0]["years"] = 8
    expected["skills"].append({"title": "React", "years": 2, "level": None})
    assert response.json() == expected
    assert len(build_dependencies.prompts) == 1
    prompt = build_dependencies.prompts[0]
    for source in (
        BASE_RESUME_TEXT,
        LINKEDIN_TEXT,
        "https://github.com/pedroaruana",
        "Perfil GitHub verificado",
        "https://pedroaruana.dev",
        json.dumps(known_skills, ensure_ascii=False),
    ):
        assert source in prompt


@pytest.mark.parametrize(
    "invalid_response",
    [
        pytest.param(None, id="empty"),
        pytest.param(
            {"score": 90, "header": {}, "qualifications": [], "others": {}},
            id="legacy-contract",
        ),
        pytest.param({"personal": {"location": {}}, "score": 90}, id="extra-field"),
        pytest.param(
            {"personal": {"location": {}, "unknown": "unexpected"}},
            id="nested-extra-field",
        ),
        pytest.param(
            {"personal": {"location": {}}, "skills": [{"name": "React", "years": 2}]},
            id="input-skill-format",
        ),
        pytest.param({"skills": []}, id="missing-personal"),
        pytest.param(ResumeScoreResult(score=80, suggestion="Improve details."), id="score-model"),
    ],
)
def test_build_endpoint_rejects_incompatible_provider_output(build_dependencies, invalid_response) -> None:
    build_dependencies._result = invalid_response

    response = asyncio.run(
        request_app(
            "POST",
            "/api/v1/build",
            files={"resume_cv": ("cv.pdf", b"CV source", "application/pdf")},
        )
    )

    assert response.status_code == 503
    detail = (
        "Ollama returned an empty response."
        if invalid_response is None
        else "Ollama returned data outside the expected schema."
    )
    assert response.json() == {"detail": detail}
    assert len(build_dependencies.prompts) == 1


def test_build_endpoint_surfaces_provider_failure_without_fabricated_resume(build_dependencies) -> None:
    build_dependencies._error = ConnectionError("internal transport diagnostic")

    response = asyncio.run(
        request_app(
            "POST",
            "/api/v1/build",
            files={"resume_cv": ("cv.pdf", b"CV source", "application/pdf")},
        )
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "Could not connect to Ollama."}
    assert len(build_dependencies.prompts) == 1


def test_analyze_remains_independent_with_real_manager_and_score_schema(build_dependencies) -> None:
    expected = {"score": 80, "suggestion": "Adicione métricas de impacto."}
    build_dependencies._result = expected

    response = asyncio.run(
        request_app(
            "POST",
            "/api/v1/analyze",
            files={"resume_cv": ("cv.pdf", b"CV source", "application/pdf")},
        )
    )

    assert response.status_code == 200
    assert response.json() == expected
    assert build_dependencies.structured_schema is ResumeScoreResult
    assert len(build_dependencies.prompts) == 1
