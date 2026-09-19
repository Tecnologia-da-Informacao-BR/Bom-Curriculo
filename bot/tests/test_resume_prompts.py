import json

import pytest

from app.models.resume_analysis import BuiltResumeResult, ResumeScoreResult
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


def test_build_prompt_describes_the_canonical_json_contract() -> None:
    prompt = build_resume_construction_prompt("Resume source", output_language="pt-BR")

    expected_fragments = [
        "Canonical JSON response contract:",
        "score, professional_summary, header, experiences, projects, qualifications, skills, languages, others",
        "Use null for unknown optional scalar values, [] for empty arrays, and {} for an empty object.",
        "Date fields are strings. Prefer YYYY-MM-DD",
        "professional_summary: string or null. When present, write it in pt-BR.",
        "header: object with exactly these keys:",
        "contacts: string or null.",
        "emails: string or null.",
        "experiences: array of objects. Each object must have exactly these keys:",
        "is_actual: boolean or null.",
        "projects: array of objects. Each object must have exactly these keys:",
        "technologies: string or null.",
        "qualifications: array of objects. Each object must have exactly these keys:",
        "type: one of elementary_education, high_school, extracurricular_course,",
        "doctorate_degree.",
        "skills: array of objects. Each object must have exactly these keys:",
        "years: integer or null.",
        "languages: array of objects. Each object must have exactly these keys:",
        "level: one of beginner, intermediate, advanced, fluent, native.",
        "others: object. Put only useful information that does not fit any field above here.",
    ]

    for fragment in expected_fragments:
        assert fragment in prompt
