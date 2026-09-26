import pytest

from app.core.settings import AISettings, ProviderSettings, Settings
from app.providers.base import AIProviderError
from app.providers.factory import ProviderFactory

"""Provider tests that never call external services."""


def _factory(**providers: ProviderSettings) -> ProviderFactory:
    base = Settings.load()
    settings = Settings(
        server=base.server,
        ai=AISettings(
            enabled_by_default=True,
            output_language="pt-BR",
            provider="auto",
            provider_chain=tuple(providers.keys()),
            providers=providers,
        ),
    )
    return ProviderFactory(settings)


def test_groq_without_key_returns_clear_error() -> None:
    factory = _factory(groq=ProviderSettings(model="openai/gpt-oss-120b", timeout_seconds=120.0, api_key=""))

    with pytest.raises(AIProviderError) as captured:
        factory.create("groq")

    assert captured.value.category == "missing_api_key"


def test_provider_uses_configured_default_model() -> None:
    factory = _factory(groq=ProviderSettings(model="openai/gpt-oss-120b", timeout_seconds=120.0, api_key="fake-key"))

    provider = factory.create("groq")

    assert provider.model == "openai/gpt-oss-120b"


def test_provider_uses_custom_configured_model() -> None:
    factory = _factory(groq=ProviderSettings(model="llama-3.3-70b-versatile", timeout_seconds=120.0, api_key="fake-key"))

    provider = factory.create("groq")

    assert provider.model == "llama-3.3-70b-versatile"


CONFIGURED_DEFAULT_MODELS = {
    "groq": "openai/gpt-oss-120b",
    "gemini": "gemini-3.5-flash",
    "deepseek": "deepseek-v4-flash",
    "openai": "gpt-5.5",
    "ollama": "qwen3:4b",
}


@pytest.mark.parametrize("name,expected_model", CONFIGURED_DEFAULT_MODELS.items())
def test_config_yaml_default_models_match_expected(name, expected_model, monkeypatch) -> None:
    monkeypatch.delenv("OLLAMA_MODEL", raising=False)
    settings = Settings.load()

    assert settings.ai.providers[name].model == expected_model


def test_ollama_environment_overrides_yaml_configuration(monkeypatch) -> None:
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://ollama.internal:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "custom-model:latest")
    monkeypatch.setenv("OLLAMA_REASONING", "true")
    monkeypatch.setenv("OLLAMA_NUM_PREDICT", "3072")
    monkeypatch.setenv("BOT_INFERENCE_DEADLINE_SECONDS", "75")

    settings = Settings.load()

    assert settings.ai.providers["ollama"].base_url == "http://ollama.internal:11434"
    assert settings.ai.providers["ollama"].model == "custom-model:latest"
    assert settings.ai.providers["ollama"].reasoning is True
    assert settings.ai.providers["ollama"].max_output_tokens == 3072
    assert settings.ai.inference_deadline_seconds == 75


def test_ollama_local_defaults_disable_reasoning_and_bound_output(monkeypatch) -> None:
    for variable in (
        "OLLAMA_MODEL",
        "OLLAMA_REASONING",
        "OLLAMA_NUM_PREDICT",
        "BOT_INFERENCE_DEADLINE_SECONDS",
    ):
        monkeypatch.delenv(variable, raising=False)

    settings = Settings.load()
    ollama = settings.ai.providers["ollama"]

    assert ollama.model == "qwen3:4b"
    assert ollama.reasoning is False
    assert ollama.max_output_tokens == 2048
    assert settings.ai.inference_deadline_seconds == 240


def test_provider_unknown_returns_error() -> None:
    factory = _factory()

    with pytest.raises(AIProviderError, match="Unrecognized"):
        factory.create("inexistente")


def test_provider_auto_is_never_directly_creatable() -> None:
    factory = _factory()

    with pytest.raises(AIProviderError, match="auto"):
        factory.create("auto")


def test_production_factory_rejects_mock_even_with_configuration() -> None:
    factory = _factory(
        mock=ProviderSettings(model="test-model", timeout_seconds=120, api_key="fake-key")
    )

    assert factory.is_configured("mock") is False
    with pytest.raises(AIProviderError, match="Unrecognized provider 'mock'"):
        factory.create("mock")
