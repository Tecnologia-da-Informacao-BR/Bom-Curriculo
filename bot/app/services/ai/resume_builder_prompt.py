"""Builds the prompt used to ask the AI to construct the best possible ATS-optimized resume."""

from datetime import date

from app.models.github_profile import GitHubProfile
from app.models.resume_analysis import SkillItem
from app.services.ai.prompt_sources import build_source_sections


_BUILT_RESUME_JSON_CONTRACT = """
Canonical JSON response contract:
- Return exactly one JSON object with these top-level keys:
  personal, professional_summary, target_role, skills, experiences, education, courses,
  languages, projects, certifications, additional_informations.
- Do not add top-level keys beyond the ones listed above.
- Include all 11 top-level keys and every field of each nested object, even when nullable.
- Use null for missing nullable information. Use [] only when no corresponding information
  is available in the supplied sources. Do not invent items to fill a list.
- personal and personal.location are required objects; include their fields even when all
  their scalar values are null. Do not replace either object with null or an empty object.
- Every non-null date must be a string in exactly YYYY-MM format. For a full date, keep
  its year and month. If a source gives only a year without a month, use null for the date.
  Never invent a month or any other missing date component.
- Numbers must be finite JSON numbers, not strings or null. Preserve supplied numeric
  values without guessing missing years of experience or course workloads.

Top-level fields:
- personal: required object with exactly these keys:
  name: string or null.
  email: string or null.
  phone: string or null.
  location: required object with exactly these keys:
    city: string or null.
    state: string or null.
    country: string or null.
  linkedin: string or null.
  github: string or null.
  portfolio: string or null.
- professional_summary: string or null. When present, write it in {output_language}.
- target_role: string or null. Use an explicitly stated target role; otherwise use null.
- skills: array of objects. Each object must have exactly these keys:
  title: string or null.
  years: number.
  level: string or null.
- experiences: array of objects. Each object must have exactly these keys:
  company: string or null.
  role: string or null.
  employment_type: string or null.
  location: string or null.
  start_date: YYYY-MM string or null.
  end_date: YYYY-MM string or null.
  current: boolean.
  description: string or null.
  responsibilities: array of strings.
  achievements: array of strings.
  skills: array of strings.
- education: array of objects. Each object must have exactly these keys:
  institution: string or null.
  degree: string or null.
  start_date: YYYY-MM string or null.
  end_date: YYYY-MM string or null.
  current: boolean.
- courses: array of objects. Each object must have exactly these keys:
  title: string or null.
  institution: string or null.
  completion_date: YYYY-MM string or null.
  workload: number.
  certificate_url: string or null.
- languages: array of objects. Each object must have exactly these keys:
  language: string or null.
  level: string or null. Preserve the proficiency stated in the sources.
- projects: array of objects. Each object must have exactly these keys:
  name: string or null.
  description: string or null.
  url: string or null.
  skills: array of strings.
- certifications: array of objects. Each object must have exactly these keys:
  title: string or null.
  issuer: string or null.
  date: YYYY-MM string or null.
  credential_url: string or null.
- additional_informations: string or null. Keep useful factual information that does not
  fit the fields above as text, not as an object or an array.

Extraction and source mapping:
- Professional experience belongs in experiences.
- Projects belong in projects.
- Formal academic education belongs in education.
- Courses belong in courses.
- Certifications belong in certifications.
- Languages belong in languages.
- Skills belong in skills.
- Do not leave any of these collections empty when corresponding information is clearly
  present in the sources. Keep education, courses, and certifications separate; do not put
  academic degrees in courses or certifications. Do not invent entries to populate them.
- Map personal details only from the supplied sources. Do not infer a city, state, or
  country that is not stated. Put the supplied LinkedIn URL in personal.linkedin.
- Treat externally supplied GitHub and portfolio URLs as verified source values for
  personal.github and personal.portfolio respectively. Copy those URLs exactly.
- additional_skills is an input source with name and years. Convert each input name to
  skills[].title and preserve supplied numeric years as skills[].years. The output skill
  object uses only title, years, and level; use null for an unstated level. Do not use name
  as an output skill field or estimate experience durations from a technology mention.
- For experiences and education, use the current/ongoing status stated in the sources.
  A missing end_date alone does not establish that current is true.
- Supplied GitHub repositories identify real projects: use their names, descriptions,
  URLs, and reported languages/technologies as evidence for projects and projects[].skills.
  Never invent repository features, responsibilities, achievements, or technologies that
  are not present in the supplied data.
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
        "wording (the professional summary, descriptions, responsibilities, and achievements) "
        "with clearer phrasing, action verbs, and better structure — but never invent, infer, or "
        "fabricate a fact (a company, job title, date, technology, institution, or "
        "achievement) that is not actually present in the given sources. When the "
        "LinkedIn text repeats or extends the resume, merge them into a single coherent "
        "set of entries within the correct collections instead of duplicating entries. "
        "Also write a short (2-4 sentence) professional_summary: an \"about this person\" "
        "bio synthesized from the "
        "facts actually present in the given sources (role, seniority, main skills, "
        "standout experience) — composing it is expected even when no source has a "
        "literal bio paragraph, but every claim in it must still be grounded in the given "
        "sources, never fabricated. If the sources do not support a professional summary, "
        "use null. "
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
