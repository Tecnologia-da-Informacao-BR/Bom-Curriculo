import asyncio

import httpx
import pytest
from langchain_core.exceptions import OutputParserException
from ollama import ResponseError
from pydantic import ValidationError

from app.models.resume_analysis import BuiltResumeResult, ResumeScoreResult
from app.providers.base import AIProviderError
from app.providers.error_mapping import map_provider_error
from app.providers.langchain_provider import LangChainProvider
from tests.fakes import FakeChatModel


def make_provider(result=None, error: Exception | None = None) -> LangChainProvider:
    provider = LangChainProvider(name="gemini", model="gemini-2.5-flash", api_key="fake-key")
    provider._chat_model = FakeChatModel(result=result, error=error)
    return provider


def test_run_structured_returns_the_parsed_model(resume_payload) -> None:
    expected = BuiltResumeResult.model_validate(resume_payload)
    provider = make_provider(result=expected)

    response = asyncio.run(provider.run_structured("short prompt", BuiltResumeResult, 0.1))

    assert response is expected
    assert response.model_dump(mode="json") == resume_payload
    assert provider._chat_model.bound_kwargs == {"temperature": 0.1}
    assert provider._chat_model.structured_schema is BuiltResumeResult


def test_ollama_disables_reasoning_and_limits_resume_output(resume_payload) -> None:
    expected = BuiltResumeResult.model_validate(resume_payload)
    provider = LangChainProvider(
        name="ollama",
        model="qwen3:4b",
        base_url="http://127.0.0.1:11434",
        reasoning=False,
        max_output_tokens=2048,
    )
    provider._chat_model = FakeChatModel(result=expected)

    response = asyncio.run(provider.run_structured("resume prompt", BuiltResumeResult, 0.2))

    assert response is expected
    assert provider._chat_model.bound_kwargs == {
        "reasoning": False,
        "options": {"temperature": 0.2, "num_predict": 2048},
    }
    assert provider._chat_model.structured_schema is BuiltResumeResult


def test_build_schema_used_for_structured_output_forbids_extra_fields(resume_payload) -> None:
    provider = make_provider(result=resume_payload)

    response = asyncio.run(provider.run_structured("resume prompt", BuiltResumeResult))

    assert isinstance(response, BuiltResumeResult)
    assert response.model_dump(mode="json") == resume_payload
    schema = provider._chat_model.structured_schema.model_json_schema()
    assert set(schema["properties"]) == set(resume_payload)
    assert len(schema["properties"]) == 11
    assert {"score", "header", "qualifications", "others"}.isdisjoint(schema["properties"])
    assert schema["additionalProperties"] is False
    assert all(item["additionalProperties"] is False for item in schema["$defs"].values())


@pytest.mark.parametrize("field", ["score", "header", "qualifications", "others", "unknown"])
def test_incompatible_structured_output_is_reported_as_schema_error(resume_payload, field) -> None:
    resume_payload[field] = "unexpected"
    provider = make_provider(result=resume_payload)

    with pytest.raises(AIProviderError) as captured:
        asyncio.run(provider.run_structured("resume prompt", BuiltResumeResult))

    assert captured.value.category == "schema_validation_error"
    assert isinstance(captured.value.__cause__, ValidationError)
    assert captured.value.__cause__.errors()[0]["type"] == "extra_forbidden"
    assert "unexpected" not in str(captured.value)


def test_score_output_keeps_its_separate_schema() -> None:
    expected = ResumeScoreResult(score=80, suggestion="Add measurable achievements.")
    provider = make_provider(result=expected.model_dump(mode="json"))

    response = asyncio.run(provider.run_structured("score prompt", ResumeScoreResult))

    assert response == expected
    assert provider._chat_model.structured_schema is ResumeScoreResult
    assert set(response.model_dump(mode="json")) == {"score", "suggestion"}


def test_empty_structured_response_raises_empty_response_category() -> None:
    provider = make_provider(result=None)

    with pytest.raises(AIProviderError) as captured:
        asyncio.run(provider.run_structured("prompt", BuiltResumeResult))

    assert captured.value.category == "empty_response"


@pytest.mark.parametrize(
    "error_type_name,status_code,expected_category",
    [
        ("RateLimitError", 429, "rate_limit_429"),
        ("AuthenticationError", 401, "auth_error_401"),
        ("PermissionDeniedError", 403, "permission_error_403"),
        ("NotFoundError", 404, "invalid_model"),
        ("BadRequestError", 400, "invalid_request"),
        ("APITimeoutError", None, "timeout"),
        ("APIConnectionError", None, "network_error"),
        ("InternalServerError", 503, "provider_unavailable"),
        ("SomethingUnexpected", None, "unknown_provider_error"),
    ],
)
def test_provider_errors_are_mapped_to_stable_categories(
    error_type_name, status_code, expected_category
) -> None:
    error_type = type(error_type_name, (Exception,), {})
    error = error_type("simulated failure")
    if status_code is not None:
        error.status_code = status_code
    provider = make_provider(error=error)

    with pytest.raises(AIProviderError) as captured:
        asyncio.run(provider.run_structured("prompt", BuiltResumeResult))

    assert captured.value.category == expected_category


def test_provider_requires_api_key_except_for_ollama() -> None:
    with pytest.raises(AIProviderError) as captured:
        LangChainProvider(name="groq", model="some-model", api_key="")
    assert captured.value.category == "missing_api_key"

    LangChainProvider(name="ollama", model="qwen3:4b", base_url="http://127.0.0.1:11434")


@pytest.mark.parametrize(
    "error,expected_category,expected_message",
    [
        (
            httpx.ConnectError(
                "All connection attempts failed",
                request=httpx.Request("POST", "http://ollama:11434/api/chat"),
            ),
            "network_error",
            "Could not connect to Ollama.",
        ),
        (
            httpx.ReadTimeout(
                "The provider exceeded its timeout",
                request=httpx.Request("POST", "http://ollama:11434/api/chat"),
            ),
            "timeout",
            "Ollama timed out.",
        ),
        (
            httpx.RemoteProtocolError("The provider closed the connection unexpectedly"),
            "network_error",
            "Could not connect to Ollama.",
        ),
        (
            httpx.InvalidURL("Invalid Ollama URL"),
            "network_error",
            "Could not connect to Ollama.",
        ),
        (
            ResponseError("model 'missing-model' not found", status_code=404),
            "invalid_model",
            "Ollama did not recognize or did not make available the configured model.",
        ),
        (
            OutputParserException(
                "Failed to parse the model response",
                llm_output="internal malformed model output",
            ),
            "response_parsing_error",
            "Ollama returned a response that could not be parsed.",
        ),
    ],
)
def test_real_ollama_errors_are_mapped_without_leaking_details(
    error: Exception, expected_category: str, expected_message: str
) -> None:
    mapped = map_provider_error("ollama", error)

    assert mapped.category == expected_category
    assert str(mapped) == expected_message
    assert str(error) not in str(mapped)


def test_run_structured_preserves_the_original_exception_as_cause() -> None:
    original = httpx.ConnectError(
        "internal connection detail",
        request=httpx.Request("POST", "http://ollama:11434/api/chat"),
    )
    provider = make_provider(error=original)

    with pytest.raises(AIProviderError) as captured:
        asyncio.run(provider.run_structured("prompt", BuiltResumeResult))

    assert captured.value.category == "network_error"
    assert captured.value.__cause__ is original


def test_nested_builtin_connection_error_is_recognized() -> None:
    original = ConnectionRefusedError("connection refused by socket")
    wrapper = RuntimeError("provider SDK wrapper")
    wrapper.__cause__ = original

    mapped = map_provider_error("ollama", wrapper)

    assert mapped.category == "network_error"
    assert str(mapped) == "Could not connect to Ollama."
