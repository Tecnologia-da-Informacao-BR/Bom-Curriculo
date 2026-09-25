import json
import re

import pytest

from app.models.github_profile import GitHubProfile, GitHubRepo
from app.models.resume_analysis import BuiltResumeResult, ResumeScoreResult, SkillItem
from app.services.ai.prompt_sources import build_source_sections
from app.services.ai.resume_builder_prompt import build_resume_construction_prompt
from app.services.ai.resume_score_prompt import build_resume_score_prompt


@pytest.mark.parametrize(
    "prompt,schema,functional_instruction",
    [
        (
            build_resume_construction_prompt("Resume source"),
            BuiltResumeResult,
            "never invent, infer, or fabricate a fact",
        ),
        (
            build_resume_score_prompt("Resume source"),
            ResumeScoreResult,
            "Do not rewrite, restructure, or extract the resume",
        ),
    ],
)
def test_prompt_relies_on_structured_output_without_repeating_json_schema(
    prompt, schema, functional_instruction
) -> None:
    serialized_schema = json.dumps(schema.model_json_schema(), ensure_ascii=False)

    assert serialized_schema not in prompt
    assert '"$defs"' not in prompt
    assert '"properties"' not in prompt
    assert functional_instruction in prompt
    assert "Return only the structured JSON response" in prompt


@pytest.fixture
def github_profile() -> GitHubProfile:
    return GitHubProfile(
        username="verified-user",
        name="Ana Silva",
        bio="Desenvolvedora Python",
        location="Salvador, BA",
        blog="https://blog.example.test",
        public_repos=1,
        top_repos=[
            GitHubRepo(
                name="Real Project",
                description="API para currículos",
                language="Python",
                url="https://github.com/verified-user/real-project",
                stars=7,
            ),
        ],
    )


def _contract_sections(prompt: str) -> dict[str, str]:
    contract = prompt.split("Top-level fields:\n", 1)[1].split(
        "Extraction and source mapping:", 1
    )[0]
    return dict(re.findall(r"(?ms)^- ([a-z_]+): (.*?)(?=^- |\Z)", contract))


def test_build_prompt_describes_exactly_the_new_top_level_keys() -> None:
    prompt = build_resume_construction_prompt("Resume source")
    expected = [
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
    ]

    assert list(_contract_sections(prompt)) == expected
    assert list(BuiltResumeResult.model_json_schema()["properties"]) == expected
    assert "Include all 11 top-level keys and every field of each nested object" in prompt
    assert "Do not add top-level keys beyond the ones listed above" in prompt


def test_prompt_nested_fields_match_the_pydantic_schema() -> None:
    sections = _contract_sections(build_resume_construction_prompt("Resume source"))
    schema = BuiltResumeResult.model_json_schema()
    for field, definition in schema["properties"].items():
        reference = definition.get("$ref") or definition.get("items", {}).get("$ref")
        if reference is None:
            continue
        nested = schema["$defs"][reference.split("/")[-1]]
        described_fields = re.findall(r"(?m)^  ([a-z_]+):", sections[field])
        assert described_fields == list(nested["properties"]), field


@pytest.mark.parametrize("with_profile", [False, True])
def test_complete_build_prompt_contains_no_legacy_contract_instructions(github_profile, with_profile) -> None:
    prompt = build_resume_construction_prompt(
        "Resume source",
        linkedin_text="LinkedIn source",
        github_url="https://github.com/verified-user",
        github_profile=github_profile if with_profile else None,
        portfolio_url="https://portfolio.example.test",
        additional_skills=[SkillItem(name="Python", years=3)],
    )

    assert not re.search(
        r"\b(score|header|qualifications|others|headline|contacts|emails|is_actual|is_coursing)\b",
        prompt,
    )
    assert not re.search(r"(?m)^  (start|end|technologies):", prompt)
    assert "header.links" not in prompt
    assert "project must include a start date" not in prompt


def test_personal_and_location_are_required_objects_with_nullable_fields() -> None:
    prompt = build_resume_construction_prompt("Resume source")
    personal = _contract_sections(prompt)["personal"]

    assert personal.startswith("required object with exactly these keys:")
    assert "  location: required object with exactly these keys:" in personal
    for field in ("name", "email", "phone", "linkedin", "github", "portfolio"):
        assert f"  {field}: string or null." in personal
    for field in ("city", "state", "country"):
        assert f"    {field}: string or null." in personal
    assert "personal and personal.location are required objects" in prompt
    assert "Do not replace either object with null or an empty object" in prompt
    assert "Put the supplied LinkedIn URL in personal.linkedin" in prompt


@pytest.mark.parametrize(
    "source,collection",
    [
        ("Professional experience", "experiences"),
        ("Projects", "projects"),
        ("Formal academic education", "education"),
        ("Courses", "courses"),
        ("Certifications", "certifications"),
        ("Languages", "languages"),
        ("Skills", "skills"),
    ],
)
def test_information_is_explicitly_routed_to_its_collection(source, collection) -> None:
    prompt = build_resume_construction_prompt("Resume source")
    assert re.search(rf"{source} belongs? in {collection}\.", prompt)


def test_education_courses_and_certifications_remain_separate() -> None:
    prompt = " ".join(build_resume_construction_prompt("Resume source").split())
    assert "Keep education, courses, and certifications separate" in prompt
    assert "do not put academic degrees in courses or certifications" in prompt


def test_empty_lists_are_only_allowed_when_sources_have_no_corresponding_data() -> None:
    prompt = " ".join(build_resume_construction_prompt("Resume source").split())
    assert "Use [] only when no corresponding information is available in the supplied sources" in prompt
    assert (
        "Do not leave any of these collections empty when corresponding information "
        "is clearly present in the sources"
    ) in prompt
    assert "Do not invent items to fill a list" in prompt
    assert "Use null for missing nullable information" in prompt


def test_external_links_are_mapped_to_personal_fields() -> None:
    prompt = build_resume_construction_prompt(
        "Resume source",
        github_url="https://github.com/verified-user",
        portfolio_url="https://portfolio.example.test",
    )
    prompt = " ".join(prompt.split())

    assert (
        "Treat externally supplied GitHub and portfolio URLs as verified source values for "
        "personal.github and personal.portfolio respectively. Copy those URLs exactly."
    ) in prompt
    assert "User's GitHub link: https://github.com/verified-user" in prompt
    assert "User's portfolio link: https://portfolio.example.test" in prompt


@pytest.mark.parametrize("github_url", [None, "https://github.com/verified-user/"])
def test_verified_github_projects_keep_only_supplied_evidence(github_profile, github_url) -> None:
    prompt = build_resume_construction_prompt(
        "Resume source", github_profile=github_profile, github_url=github_url
    )
    normalized = " ".join(prompt.split())

    assert "personal.github" in prompt
    assert f"GitHub): {github_url or 'https://github.com/verified-user'}" in prompt
    assert "Name: Ana Silva" in prompt
    assert "Bio: Desenvolvedora Python" in prompt
    assert "Location: Salvador, BA" in prompt
    assert "Website: https://blog.example.test" in prompt
    assert "Public repositories: 1" in prompt
    assert (
        "Real Project [Python] — API para currículos "
        "(https://github.com/verified-user/real-project, 7 stars)"
    ) in prompt
    assert "Supplied GitHub repositories identify real projects" in prompt
    assert "as evidence for projects and projects[].skills" in prompt
    assert (
        "Never invent repository features, responsibilities, achievements, or technologies "
        "that are not present in the supplied data"
    ) in normalized


def test_additional_skills_preserve_input_and_describe_output_conversion() -> None:
    skills = [SkillItem(name='C++ "moderno"', years=3), SkillItem(name="Python")]
    sections = build_source_sections("Resume source", additional_skills=skills)
    source_payload = json.loads(sections[-1].split("\n", 1)[1])
    assert source_payload == [
        {"name": 'C++ "moderno"', "years": 3},
        {"name": "Python", "years": None},
    ]
    assert [skill.model_dump(mode="json") for skill in skills] == source_payload

    prompt = build_resume_construction_prompt("Resume source", additional_skills=skills)
    normalized = " ".join(prompt.split())
    assert "additional_skills is an input source with name and years" in prompt
    assert "Convert each input name to skills[].title" in normalized
    assert "preserve supplied numeric years as skills[].years" in prompt
    assert "uses only title, years, and level; use null for an unstated level" in prompt
    assert "Do not use name as an output skill field" in normalized
    assert "years: number." in _contract_sections(prompt)["skills"]


def test_rewriting_is_limited_to_facts_present_in_sources() -> None:
    prompt = " ".join(build_resume_construction_prompt("Resume source").split())
    assert "never invent, infer, or fabricate a fact" in prompt
    assert "that is not actually present in the given sources" in prompt
    assert "the professional summary, descriptions, responsibilities, and achievements" in prompt
    assert "every claim in it must still be grounded in the given sources" in prompt
    assert "use null" in _contract_sections(build_resume_construction_prompt("Resume source"))["target_role"]


def test_dates_keep_known_month_precision_without_inventing_months() -> None:
    prompt = " ".join(build_resume_construction_prompt("Resume source").split())
    assert "Every non-null date must be a string in exactly YYYY-MM format" in prompt
    assert "For a full date, keep its year and month" in prompt
    assert "If a source gives only a year without a month, use null for the date" in prompt
    assert "Never invent a month or any other missing date component" in prompt
    assert "A missing end_date alone does not establish that current is true" in prompt


def test_required_numbers_are_not_guessed_or_changed_to_nullable() -> None:
    prompt = " ".join(build_resume_construction_prompt("Resume source").split())
    assert "Numbers must be finite JSON numbers, not strings or null" in prompt
    assert "without guessing missing years of experience or course workloads" in prompt
    assert "years: number." in prompt
    assert "workload: number." in prompt


@pytest.mark.parametrize("output_language", ["pt-BR", "en"])
def test_professional_summary_uses_the_requested_language(output_language) -> None:
    prompt = build_resume_construction_prompt("Resume source", output_language=output_language)
    assert f"professional_summary: string or null. When present, write it in {output_language}" in prompt
    assert "{output_language}" not in prompt


def test_shared_sources_do_not_add_resume_output_instructions_to_scoring(github_profile) -> None:
    prompt = build_resume_score_prompt(
        "Resume source",
        linkedin_text="LinkedIn source",
        github_url="https://github.com/verified-user",
        github_profile=github_profile,
        portfolio_url="https://portfolio.example.test",
        additional_skills=[SkillItem(name="Python", years=3)],
    )

    assert "Produce a 0-100 score" in prompt
    assert "and one direct, actionable improvement suggestion" in prompt
    assert "LinkedIn resume text:\nLinkedIn source" in prompt
    assert "https://portfolio.example.test" in prompt
    assert "Real Project [Python]" in prompt
    assert '"name": "Python", "years": 3' in prompt
    assert "personal.github" not in prompt
    assert "skills[].title" not in prompt
    assert "header.links" not in prompt
