"""Format source data without imposing an output contract on the consuming prompt."""

import json

from app.models.github_profile import GitHubProfile
from app.models.resume_analysis import SkillItem


def build_source_sections(
    resume_text: str,
    linkedin_text: str | None = None,
    github_url: str | None = None,
    github_profile: GitHubProfile | None = None,
    portfolio_url: str | None = None,
    additional_skills: list[SkillItem] | None = None,
) -> list[str]:
    sources = [f"Resume text:\n{resume_text}"]
    if linkedin_text:
        sources.append(f"LinkedIn resume text:\n{linkedin_text}")
    if github_profile:
        sources.append(_format_github_profile(github_profile, github_url))
    elif github_url:
        sources.append(f"User's GitHub link: {github_url}")
    if portfolio_url:
        sources.append(f"User's portfolio link: {portfolio_url}")
    if additional_skills:
        skills_list = json.dumps(
            [skill.model_dump(mode="json") for skill in additional_skills],
            ensure_ascii=False,
        )
        sources.append(
            "Additional skills reported by the user (additional_skills input: name and years):\n"
            f"{skills_list}"
        )
    return sources


def _format_github_profile(profile: GitHubProfile, github_url: str | None) -> str:
    lines = [
        f'Verified GitHub profile for "{profile.username}" (real data fetched live from '
        f"GitHub): {github_url or f'https://github.com/{profile.username}'}"
    ]
    if profile.name:
        lines.append(f"Name: {profile.name}")
    if profile.bio:
        lines.append(f"Bio: {profile.bio}")
    if profile.location:
        lines.append(f"Location: {profile.location}")
    if profile.blog:
        lines.append(f"Website: {profile.blog}")
    lines.append(f"Public repositories: {profile.public_repos}")
    if profile.top_repos:
        lines.append("Top own (non-fork) repositories fetched from GitHub:")
        for repo in profile.top_repos:
            language = f" [{repo.language}]" if repo.language else ""
            description = f" — {repo.description}" if repo.description else ""
            lines.append(f"- {repo.name}{language}{description} ({repo.url}, {repo.stars} stars)")
    return "\n".join(lines)
