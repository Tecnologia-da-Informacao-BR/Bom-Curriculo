"""Output-model compatibility with the payload consumed by Laravel."""

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.models.resume_analysis import (
    BuiltResumeResult,
    CertificationItem,
    CourseItem,
    EducationItem,
    ExperienceItem,
    LanguageItem,
    Location,
    Personal,
    ProjectItem,
    ResumeAnalysisRequest,
    ResumeScoreResult,
    ResumeSkillItem,
    SkillItem,
)

OUTPUT_KEYS = (
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
)
COLLECTION_MODELS = (
    ("skills", ResumeSkillItem),
    ("experiences", ExperienceItem),
    ("education", EducationItem),
    ("courses", CourseItem),
    ("languages", LanguageItem),
    ("projects", ProjectItem),
    ("certifications", CertificationItem),
)
DATE_FIELDS = (
    ("experiences", "start_date"),
    ("experiences", "end_date"),
    ("education", "start_date"),
    ("education", "end_date"),
    ("courses", "completion_date"),
    ("certifications", "date"),
)


@pytest.fixture
def payload() -> dict:
    # Reuse the consumer's fixture so the two services exercise the same contract.
    path = (
        Path(__file__).resolve().parents[2]
        / "backend/tests/Fixtures/bot_resume_payload.json"
    )
    return json.loads(path.read_text(encoding="utf-8"))


def test_complete_laravel_payload_round_trips_without_legacy_fields(payload) -> None:
    result = BuiltResumeResult.model_validate(payload)

    assert result.model_dump(mode="json") == payload
    assert BuiltResumeResult.model_validate_json(result.model_dump_json()) == result
    assert tuple(result.model_dump(mode="json")) == OUTPUT_KEYS
    assert {"score", "header", "qualifications", "others"}.isdisjoint(
        BuiltResumeResult.model_fields
    )
    assert isinstance(result.personal, Personal)
    assert isinstance(result.personal.location, Location)
    assert result.additional_informations == payload["additional_informations"]


def test_empty_resume_preserves_nullable_fields_and_empty_lists() -> None:
    result = BuiltResumeResult(personal=Personal(location=Location()))

    assert result.model_dump(mode="json") == {
        "personal": {
            "name": None,
            "email": None,
            "phone": None,
            "location": {"city": None, "state": None, "country": None},
            "linkedin": None,
            "github": None,
            "portfolio": None,
        },
        "professional_summary": None,
        "target_role": None,
        "skills": [],
        "experiences": [],
        "education": [],
        "courses": [],
        "languages": [],
        "projects": [],
        "certifications": [],
        "additional_informations": None,
    }


def test_json_schema_matches_laravel_fields_at_every_level(payload) -> None:
    schema = BuiltResumeResult.model_json_schema()

    assert tuple(schema["properties"]) == OUTPUT_KEYS
    assert schema["required"] == ["personal"]
    assert schema["additionalProperties"] is False
    assert schema["$defs"]["Personal"]["required"] == ["location"]
    expected_objects = [
        ("Personal", payload["personal"]),
        ("Location", payload["personal"]["location"]),
        *((model.__name__, payload[field][0]) for field, model in COLLECTION_MODELS),
    ]
    for name, expected in expected_objects:
        definition = schema["$defs"][name]
        assert set(definition["properties"]) == set(expected)
        assert definition["additionalProperties"] is False
        for field, value in expected.items():
            if value is None or isinstance(value, str):
                assert {"type": "null"} in definition["properties"][field]["anyOf"]
    for field in ("professional_summary", "target_role", "additional_informations"):
        assert {"type": "null"} in schema["properties"][field]["anyOf"]
    assert {"ResumeHeader", "QualificationItem", "SkillItem"}.isdisjoint(schema["$defs"])


@pytest.mark.parametrize("field,model", COLLECTION_MODELS)
def test_valid_collection_items_and_their_nullable_scalars(payload, field, model) -> None:
    result = BuiltResumeResult.model_validate(payload)
    assert isinstance(getattr(result, field)[0], model)
    assert getattr(result, field)[0].model_dump(mode="json") == payload[field][0]

    nullable_item = {
        key: None if isinstance(value, str) else value
        for key, value in payload[field][0].items()
    }
    assert model.model_validate(nullable_item).model_dump(mode="json") == nullable_item


@pytest.mark.parametrize(
    "value",
    [
        {},
        {"personal": None},
        {"personal": {}},
        {"personal": {"location": None}},
        {"personal": {"location": "Salvador, BA"}},
        {"personal": {"location": []}},
    ],
)
def test_personal_and_location_are_required_objects(value) -> None:
    with pytest.raises(ValidationError):
        BuiltResumeResult.model_validate(value)


@pytest.mark.parametrize("field", ["score", "header", "qualifications", "others", "unknown"])
def test_top_level_legacy_and_extra_fields_are_rejected(payload, field) -> None:
    payload[field] = None

    with pytest.raises(ValidationError) as captured:
        BuiltResumeResult.model_validate(payload)

    assert captured.value.errors()[0]["type"] == "extra_forbidden"
    assert captured.value.errors()[0]["loc"] == (field,)


@pytest.mark.parametrize(
    "path",
    [("personal",), ("personal", "location")]
    + [(field, 0) for field, _ in COLLECTION_MODELS],
)
def test_nested_extra_fields_are_rejected(payload, path) -> None:
    target = payload
    for part in path:
        target = target[part]
    target["unknown"] = "unexpected"

    with pytest.raises(ValidationError) as captured:
        BuiltResumeResult.model_validate(payload)

    assert captured.value.errors()[0]["type"] == "extra_forbidden"
    assert captured.value.errors()[0]["loc"] == (*path, "unknown")


@pytest.mark.parametrize("section,field", [("skills", "years"), ("courses", "workload")])
@pytest.mark.parametrize("value", [0, 6, 6.5, -0.5])
def test_numeric_fields_preserve_finite_numbers(payload, section, field, value) -> None:
    payload[section][0][field] = value
    assert BuiltResumeResult.model_validate(payload).model_dump(mode="json") == payload


@pytest.mark.parametrize("section,field", [("skills", "years"), ("courses", "workload")])
@pytest.mark.parametrize("value", [None, True, "6.5", float("nan"), float("inf"), -float("inf")])
def test_numeric_fields_reject_non_numbers_and_non_finite_values(payload, section, field, value) -> None:
    payload[section][0][field] = value
    with pytest.raises(ValidationError):
        BuiltResumeResult.model_validate(payload)


@pytest.mark.parametrize(
    "section,field",
    [
        ("skills", "years"),
        ("courses", "workload"),
        ("experiences", "current"),
        ("education", "current"),
    ],
)
def test_required_numbers_and_booleans_have_no_invented_defaults(payload, section, field) -> None:
    del payload[section][0][field]
    with pytest.raises(ValidationError) as captured:
        BuiltResumeResult.model_validate(payload)
    assert captured.value.errors()[0]["loc"] == (section, 0, field)


@pytest.mark.parametrize("section", ["experiences", "education"])
@pytest.mark.parametrize("value", [None, 0, "false"])
def test_current_requires_a_boolean(payload, section, value) -> None:
    payload[section][0]["current"] = value
    with pytest.raises(ValidationError):
        BuiltResumeResult.model_validate(payload)


@pytest.mark.parametrize("section,field", DATE_FIELDS)
def test_dates_accept_only_month_precision_or_null(payload, section, field) -> None:
    for value in ("2024-01", "2024-12", None):
        payload[section][0][field] = value
        assert BuiltResumeResult.model_validate(payload).model_dump(mode="json") == payload

    for value in ("2024", "2024-1", "2024-00", "2024-13", "2024-01-01", "2024-01\n"):
        payload[section][0][field] = value
        with pytest.raises(ValidationError):
            BuiltResumeResult.model_validate(payload)


@pytest.mark.parametrize("section,field", DATE_FIELDS)
def test_date_constraints_are_present_in_the_json_schema(section, field) -> None:
    schema = BuiltResumeResult.model_json_schema()
    reference = schema["properties"][section]["items"]["$ref"].split("/")[-1]
    alternatives = schema["$defs"][reference]["properties"][field]["anyOf"]
    assert {"type": "null"} in alternatives
    assert {"type": "string", "pattern": r"^[0-9]{4}-(0[1-9]|1[0-2])$"} in alternatives


@pytest.mark.parametrize("field,model", COLLECTION_MODELS)
def test_default_collections_are_independent(payload, field, model) -> None:
    first = BuiltResumeResult(personal={"location": {}})
    second = BuiltResumeResult(personal={"location": {}})

    getattr(first, field).append(model.model_validate(payload[field][0]))
    assert getattr(second, field) == []


@pytest.mark.parametrize(
    "model,required,field",
    [
        (ExperienceItem, {"current": False}, field)
        for field in ("responsibilities", "achievements", "skills")
    ]
    + [(ProjectItem, {}, "skills")],
)
def test_nested_string_lists_are_independent_and_validate_items(model, required, field) -> None:
    first = model(**required)
    second = model(**required)
    getattr(first, field).append("Python")
    assert getattr(second, field) == []

    for invalid in (None, {}, [123], [None]):
        with pytest.raises(ValidationError):
            model(**required, **{field: invalid})


def test_language_level_is_nullable_free_text() -> None:
    assert LanguageItem(language="English", level="B2").level == "B2"
    assert LanguageItem().model_dump(mode="json") == {"language": None, "level": None}


def test_additional_skills_keep_the_original_input_contract() -> None:
    skills = [{"name": "Docker", "years": 3}, {"name": "Python", "years": None}]
    request = ResumeAnalysisRequest(resume_cv=b"PDF bytes", additional_skills=skills)

    assert all(isinstance(skill, SkillItem) for skill in request.additional_skills)
    assert [skill.model_dump(mode="json") for skill in request.additional_skills] == skills
    assert SkillItem(name="Rust").model_dump(mode="json") == {"name": "Rust", "years": None}
    schema = ResumeAnalysisRequest.model_json_schema()
    assert set(schema["$defs"]["SkillItem"]["properties"]) == {"name", "years"}
    assert "ResumeSkillItem" not in schema["$defs"]


def test_scoring_contract_is_unchanged() -> None:
    payload = {"score": 80, "suggestion": "Add measurable achievements."}
    assert ResumeScoreResult.model_validate(payload).model_dump(mode="json") == payload
