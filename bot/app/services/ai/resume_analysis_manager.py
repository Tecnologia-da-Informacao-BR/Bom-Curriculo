import asyncio
import logging
from collections.abc import Callable
from typing import TypeVar

from pydantic import BaseModel

from app.core.settings import Settings
from app.models.github_profile import GitHubProfile
from app.models.resume_analysis import (
    BuiltResumeResult,
    ResumeScoreResult,
    ResumeSkillItem,
    SkillItem,
)
from app.providers.base import AIProvider, AIProviderError
from app.providers.factory import ProviderFactory, SUPPORTED_PROVIDERS
from app.providers.interfaces import ProviderFactoryInterface
from app.services.ai.interfaces import ResumeAnalysisManagerInterface
from app.services.ai.resume_builder_prompt import build_resume_construction_prompt
from app.services.ai.resume_score_prompt import build_resume_score_prompt

logger = logging.getLogger(__name__)

_ERROR_MESSAGES = {
    "missing_api_key": "{label} has no minimal configuration.",
    "auth_error_401": "{label} rejected the authentication.",
    "permission_error_403": "{label} rejected the requested permission.",
    "rate_limit_429": "{label} reached the request rate limit.",
    "timeout": "{label} exceeded the time limit.",
    "network_error": "Could not connect to {label}.",
    "invalid_model": "{label} did not recognize or did not make available the configured model.",
    "invalid_request": "{label} rejected the request format.",
    "request_too_large": "{label} rejected the request for exceeding the allowed size.",
    "invalid_json": "{label} returned invalid or empty JSON.",
    "json_truncated": "{label} returned apparently truncated JSON.",
    "empty_response": "{label} returned an empty response.",
    "schema_validation_error": "{label} returned data outside the expected schema.",
    "response_parsing_error": "{label} returned a response that could not be parsed.",
    "provider_unavailable": "{label} is temporarily unavailable.",
    "unknown_provider_error": "{label} returned an unclassified error.",
}

_SchemaT = TypeVar("_SchemaT", bound=BaseModel)


class ResumeAnalysisManager(ResumeAnalysisManagerInterface):
    """Selects, calls, and safely falls back across configured AI providers."""

    def __init__(
        self,
        settings: Settings | None = None,
        provider_factory: ProviderFactoryInterface | None = None,
    ) -> None:
        self._settings = settings or Settings.load()
        self._provider_factory = provider_factory or ProviderFactory(self._settings)

    def get_provider_chain(self) -> list[str]:
        selected = self._settings.ai.provider
        if selected != "auto":
            if selected not in SUPPORTED_PROVIDERS and selected != "mock":
                raise AIProviderError(f"Unrecognized provider '{selected}'.")
            return [selected]
        chain = list(dict.fromkeys(self._settings.ai.provider_chain))
        invalid = [item for item in chain if item not in SUPPORTED_PROVIDERS and item != "mock"]
        if invalid:
            raise AIProviderError("The provider chain contains an unrecognized provider.")
        if not chain:
            raise AIProviderError("The provider chain has no valid providers.")
        return chain

    def is_provider_configured(self, name: str) -> bool:
        return self._provider_factory.is_configured(name)

    def _safe_error(self, name: str, error: Exception) -> AIProviderError:
        label = name.capitalize()
        category = getattr(error, "category", "unknown_provider_error")
        status = getattr(error, "status_http", None)
        template = _ERROR_MESSAGES.get(category, _ERROR_MESSAGES["unknown_provider_error"])
        return AIProviderError(template.format(label=label), category=category, status_http=status)

    async def score_resume(
        self,
        resume_text: str,
        factory: Callable[[str], AIProvider] | None = None,
        linkedin_text: str | None = None,
        github_url: str | None = None,
        github_profile: GitHubProfile | None = None,
        portfolio_url: str | None = None,
        additional_skills: list[SkillItem] | None = None,
    ) -> ResumeScoreResult:
        """Judge the resume exactly as given: a 0-100 ATS score plus one improvement suggestion."""

        prompt = build_resume_score_prompt(
            resume_text,
            self._settings.ai.output_language,
            linkedin_text=linkedin_text,
            github_url=github_url,
            github_profile=github_profile,
            portfolio_url=portfolio_url,
            additional_skills=additional_skills,
        )
        return await self._run_with_fallback(prompt, ResumeScoreResult, factory)

    async def build_resume(
        self,
        resume_text: str,
        factory: Callable[[str], AIProvider] | None = None,
        linkedin_text: str | None = None,
        github_url: str | None = None,
        github_profile: GitHubProfile | None = None,
        portfolio_url: str | None = None,
        additional_skills: list[SkillItem] | None = None,
    ) -> BuiltResumeResult:
        """Reconstruct the best possible ATS-optimized resume from every given source.

        ``linkedin_text``/``github_url``/``portfolio_url``/``additional_skills`` are
        optional supporting sources folded into the same prompt as the base resume,
        so the AI produces one coherent result instead of the caller merging several.
        ``github_profile`` is real data fetched live from GitHub (see
        GitHubProfileFetcher) — a stronger, verified version of ``github_url``.
        """

        prompt = build_resume_construction_prompt(
            resume_text,
            self._settings.ai.output_language,
            linkedin_text=linkedin_text,
            github_url=github_url,
            github_profile=github_profile,
            portfolio_url=portfolio_url,
            additional_skills=additional_skills,
        )
        result = await self._run_with_fallback(prompt, BuiltResumeResult, factory)
        return self._merge_known_facts(result, github_url, portfolio_url, additional_skills)

    async def _run_with_fallback(
        self,
        prompt: str,
        schema: type[_SchemaT],
        factory: Callable[[str], AIProvider] | None,
    ) -> _SchemaT:
        factory = factory or self._provider_factory.create
        try:
            return await asyncio.wait_for(
                self._run_provider_chain(prompt, schema, factory),
                timeout=self._settings.ai.inference_deadline_seconds,
            )
        except TimeoutError as error:
            logger.warning(
                "AI inference deadline exceeded.",
                exc_info=True,
                extra={
                    "error_category": "timeout",
                    "inference_deadline_seconds": self._settings.ai.inference_deadline_seconds,
                },
            )
            raise AIProviderError(
                "AI inference exceeded the time limit.", category="timeout"
            ) from error

    async def _run_provider_chain(
        self,
        prompt: str,
        schema: type[_SchemaT],
        factory: Callable[[str], AIProvider],
    ) -> _SchemaT:
        last_error: AIProviderError | None = None

        for name in self.get_provider_chain():
            if not self.is_provider_configured(name):
                continue

            try:
                provider = factory(name)
                result = await provider.run_structured(prompt, schema, temperature=0.2)
            except Exception as error:
                safe_error = self._safe_error(name, error)
                provider_settings = self._settings.ai.providers.get(name)
                logger.warning(
                    "AI provider attempt failed.",
                    exc_info=True,
                    extra={
                        "provider_name": name,
                        "error_category": safe_error.category,
                        "provider_status": safe_error.status_http,
                        "exception_type": type(error).__name__,
                        "model_name": getattr(provider_settings, "model", None),
                        "provider_base_url": getattr(provider_settings, "base_url", None),
                    },
                )
                last_error = safe_error
                continue

            if isinstance(result, schema):
                return result
            last_error = AIProviderError(
                f"{name.capitalize()} returned data outside the expected schema.",
                category="schema_validation_error",
            )

        raise last_error or AIProviderError(
            "No AI provider is configured.", category="missing_api_key"
        )

    def _merge_known_facts(
        self,
        result: BuiltResumeResult,
        github_url: str | None,
        portfolio_url: str | None,
        additional_skills: list[SkillItem] | None,
    ) -> BuiltResumeResult:
        """Force in values we already know exactly, regardless of what the AI did with them.

        The prompt already asks the AI to place these, but instruction-following isn't
        guaranteed — GitHub/portfolio links and user-typed skills are known facts, not
        something that needs to be inferred, so they must never depend on the AI
        transcribing them correctly. New skills require reported years to satisfy
        the output contract without inventing a number.
        """

        if github_url:
            result.personal.github = github_url
        if portfolio_url:
            result.personal.portfolio = portfolio_url
        if additional_skills:
            by_title = {
                skill.title.strip().lower(): skill
                for skill in result.skills
                if skill.title is not None
            }
            for reported in additional_skills:
                key = reported.name.strip().lower()
                existing = by_title.get(key)
                if existing is not None:
                    # The user's own reported years take precedence over the AI's guess.
                    if reported.years is not None:
                        existing.years = reported.years
                elif reported.years is None:
                    logger.warning(
                        "Additional skill %r was not added to the structured resume "
                        "because years is null; the output contract requires a number.",
                        reported.name,
                    )
                else:
                    new_skill = ResumeSkillItem(
                        title=reported.name, years=reported.years, level=None
                    )
                    result.skills.append(new_skill)
                    by_title[key] = new_skill
        return result
