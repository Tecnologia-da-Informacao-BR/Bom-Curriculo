"""Test doubles for provider responses; never imported by application code."""

from pydantic import BaseModel

from app.providers.base import AIProvider


class MockProvider(AIProvider):
    name = "mock"

    def __init__(
        self,
        model: str = "modelo-mock",
        structured_response: BaseModel | dict | None = None,
        simulated_error: Exception | None = None,
    ) -> None:
        self.model = model
        self.structured_response = structured_response
        self.simulated_error = simulated_error
        self.prompts: list[str] = []

    async def run_structured(
        self, prompt: str, schema: type[BaseModel], temperature: float = 0.2
    ) -> BaseModel | None:
        self.prompts.append(prompt)
        if self.simulated_error is not None:
            raise self.simulated_error
        if self.structured_response is None:
            return None
        if isinstance(self.structured_response, BaseModel):
            return self.structured_response
        return schema.model_validate(self.structured_response)


class FakeStructuredRunnable:
    def __init__(self, chat_model, result=None, error: Exception | None = None):
        self._chat_model = chat_model
        self._result = result
        self._error = error

    def bind(self, **kwargs):
        self._chat_model.bound_kwargs = kwargs
        return self

    async def ainvoke(self, prompt):
        self._chat_model.prompts.append(prompt)
        if self._error is not None:
            raise self._error
        if isinstance(self._result, dict):
            # Simulate LangChain's parsing using the schema supplied by the provider.
            return self._chat_model.structured_schema.model_validate(self._result)
        return self._result


class FakeChatModel:
    def __init__(self, result=None, error: Exception | None = None):
        self._result = result
        self._error = error
        self.bound_kwargs: dict | None = None
        self.structured_schema = None
        self.prompts: list[str] = []

    def bind(self, **kwargs):
        self.bound_kwargs = kwargs
        return self

    def with_structured_output(self, schema):
        self.structured_schema = schema
        return FakeStructuredRunnable(self, self._result, self._error)
