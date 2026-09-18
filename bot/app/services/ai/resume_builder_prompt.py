"""Builds the prompt used to ask the AI to construct the best possible ATS-optimized resume."""

from datetime import date

from app.models.github_profile import GitHubProfile
from app.models.resume_analysis import SkillItem
from app.services.ai.prompt_sources import build_source_sections


_BUILT_RESUME_JSON_CONTRACT = """
Canonical JSON response contract:
- Return exactly one JSON object with these top-level keys:
  score, professional_summary, header, experiences, projects, qualifications, skills, languages, others.
- Do not add top-level keys beyond the ones listed above.
- Include every top-level key even when its value is empty.
- Use null for unknown optional scalar values, [] for empty arrays, and {} for an empty object.
- Date fields are strings. Prefer YYYY-MM-DD when the exact day is known, YYYY-MM when only
  month/year is known, and YYYY when only the year is known. Do not invent missing date parts.

Top-level fields:
- score: integer from 0 to 100.
- professional_summary: string or null. When present, write it in {output_language}.
- header: object with exactly these keys:
  name: string or null.
  headline: string or null.
  email: string or null.
  location: string or null.
  contacts: string or null.
  emails: string or null.
  links: object whose keys are link labels and values are URL strings.
- experiences: array of objects. Each object must have exactly these keys:
  company: string.
  role: string.
  start: string or null.
  end: string or null.
  description: string or null.
  is_actual: boolean or null.
  city: string or null.
  state: string or null.
  country: string or null.
- projects: array of objects. Each object must have exactly these keys:
  title: string.
  start: string or null.
  end: string or null.
  technologies: string or null.
  description: string or null.
  url: string or null.
- qualifications: array of objects. Each object must have exactly these keys:
  type: one of elementary_education, high_school, extracurricular_course,
    technical_course, undergraduate_degree, postgraduate_degree, master_degree,
    doctorate_degree.
  institution: string.
  title: string.
  start: string or null.
  end: string or null.
  is_coursing: boolean.
- skills: array of objects. Each object must have exactly these keys:
  name: string.
  years: integer or null.
- languages: array of objects. Each object must have exactly these keys:
  level: one of beginner, intermediate, advanced, fluent, native.
  language: string.
- others: object. Put only useful information that does not fit any field above here.
""".strip()


def build_resume_construction_prompt(
    resume_text: str,
    output_language: str = "pt-BR",
    linkedin_text: str | None = None,
    github_url: str | None = None,
    github_profile: GitHubProfile | None = None,
    portfolio_url: str | None = None,
    additional_skills: list[SkillItem] | None = None,
) -> str:
    instructions = (
        f"Today's date is {date.today().isoformat()}. "
        "You are an ATS and resume-writing expert. Read the resume text below — and "
        "the supporting sources after it, if any — and construct the best possible "
        "ATS-optimized version of this person's resume. You may rewrite and strengthen "
        "wording (experience/project descriptions, the professional summary) with clearer "
        "phrasing, action verbs, and better structure — but never invent, infer, or "
        "fabricate a fact (a company, job title, date, technology, institution, or "
        "achievement) that is not actually present in the given sources. When the "
        "LinkedIn text repeats or extends the resume, merge them into a single coherent "
        "set of experiences/qualifications/projects instead of duplicating entries. Every "
        "project must include a start date, and an end date whenever the sources state "
        "one (an open-ended/ongoing project can leave end null). Also write a short (2-4 "
        "sentence) professional_summary: an \"about this person\" bio synthesized from the "
        "facts actually present in the given sources (role, seniority, main skills, "
        "standout experience) — composing it is expected even when no source has a "
        "literal bio paragraph, but every claim in it must still be grounded in the given "
        "sources, never fabricated. Also produce a 0-100 score for how well-written and "
        "ATS-friendly the constructed resume is. "
        f"Write the professional_summary in {output_language}. "
        f"{_BUILT_RESUME_JSON_CONTRACT.replace('{output_language}', output_language)} "
        "Return only the structured JSON response, without Markdown or commentary."
    )

    sources = build_source_sections(
        resume_text,
        linkedin_text=linkedin_text,
        github_url=github_url,
        github_profile=github_profile,
        portfolio_url=portfolio_url,
        additional_skills=additional_skills,
    )
    return instructions + "\n\n" + "\n\n".join(sources)
