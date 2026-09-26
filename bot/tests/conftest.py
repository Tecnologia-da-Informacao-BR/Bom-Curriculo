import json
from pathlib import Path

import pytest

from app.core.settings import Settings
from tests.fakes import FakeChatModel


@pytest.fixture(autouse=True)
def load_example_configuration(monkeypatch) -> None:
    # Keep tests independent of the developer's untracked config.yaml.
    load = Settings.load
    config_path = Path(__file__).resolve().parents[1] / "config.yaml.example"
    monkeypatch.setattr(Settings, "load", staticmethod(lambda: load(config_path)))


@pytest.fixture(autouse=True)
def stub_chat_model(monkeypatch) -> FakeChatModel:
    # SDK clients are never created by the suite, so no test can invoke a real LLM.
    chat_model = FakeChatModel()
    monkeypatch.setattr(
        "app.providers.langchain_provider.init_chat_model",
        lambda *_args, **_kwargs: chat_model,
    )
    return chat_model


@pytest.fixture
def resume_payload() -> dict:
    # Exercise the same contract fixture as the Laravel consumer and model tests.
    path = (
        Path(__file__).resolve().parents[2]
        / "backend/tests/Fixtures/bot_resume_payload.json"
    )
    return json.loads(path.read_text(encoding="utf-8"))
