"""Resume input, scoring, and structured output contracts.

``BuiltResumeResult`` follows Laravel's personal/education/courses contract.
Input skills retain the name/years shape sent by Laravel and are independent
of the title/years/level skills produced by the AI.
"""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

# Keep dates as strings and expose the same month precision in the JSON schema.
YearMonth = Annotated[str, Field(pattern=r"^[0-9]{4}-(0[1-9]|1[0-2])$")]


class Location(BaseModel):
    city: str | None = None
    state: str | None = None
    country: str | None = None

    model_config = ConfigDict(extra="forbid", strict=True)


class Personal(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: Location
    linkedin: str | None = None
    github: str | None = None
    portfolio: str | None = None

    model_config = ConfigDict(extra="forbid", strict=True)


class ResumeSkillItem(BaseModel):
    """Output skill; distinct from the user-reported input ``SkillItem``."""

    title: str | None = None
    years: int | float
    level: str | None = None

    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)


class ExperienceItem(BaseModel):
    company: str | None = None
    role: str | None = None
    employment_type: str | None = None
    location: str | None = None
    start_date: YearMonth | None = None
    end_date: YearMonth | None = None
    current: bool
    description: str | None = None
    responsibilities: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid", strict=True)


class EducationItem(BaseModel):
    institution: str | None = None
    degree: str | None = None
    start_date: YearMonth | None = None
    end_date: YearMonth | None = None
    current: bool

    model_config = ConfigDict(extra="forbid", strict=True)


class CourseItem(BaseModel):
    title: str | None = None
    institution: str | None = None
    completion_date: YearMonth | None = None
    workload: int | float
    certificate_url: str | None = None

    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)


class LanguageItem(BaseModel):
    language: str | None = None
    level: str | None = None

    model_config = ConfigDict(extra="forbid", strict=True)


class ProjectItem(BaseModel):
    name: str | None = None
    description: str | None = None
    url: str | None = None
    skills: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid", strict=True)


class CertificationItem(BaseModel):
    title: str | None = None
    issuer: str | None = None
    date: YearMonth | None = None
    credential_url: str | None = None

    model_config = ConfigDict(extra="forbid", strict=True)


class SkillItem(BaseModel):
    """User-reported input skill, preserving Laravel's name/years payload."""

    name: str
    years: int | None = None

    model_config = ConfigDict(extra="forbid")


class ResumeScoreResult(BaseModel):
    """Just an ATS quality judgment of the resume as given — no reconstruction."""

    score: int = Field(ge=0, le=100)
    suggestion: str

    model_config = ConfigDict(extra="forbid")


class BuiltResumeResult(BaseModel):
    """The best possible ATS-optimized version of the resume, reconstructed by the AI

    from the base CV plus every supporting source (no job posting involved).
    """

    personal: Personal
    # Short first-person-adjacent bio/"about" paragraph, written by the AI from the
    # given sources — not copied verbatim from the resume (most resumes don't have one).
    professional_summary: str | None = None
    target_role: str | None = None
    skills: list[ResumeSkillItem] = Field(default_factory=list)
    experiences: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    courses: list[CourseItem] = Field(default_factory=list)
    languages: list[LanguageItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    additional_informations: str | None = None

    model_config = ConfigDict(extra="forbid", strict=True)


class ResumeAnalysisRequest(BaseModel):
    """HTTP boundary request: the base CV plus optional supporting sources.

    No job posting is involved here. Sent as ``multipart/form-data`` —
    ``resume_cv`` is a required actual PDF/DOCX file upload (never a URL the
    bot has to fetch itself, and never just inline text). Every other source
    is optional supporting context that gets folded into the same extraction
    instead of triggering a second AI call.
    """

    resume_cv: bytes = Field(..., description="PDF or DOCX file")
    # PDF only: LinkedIn's own "save to PDF" export is the only format users
    # realistically have for it.
    resume_linkedin: bytes | None = Field(None, description="PDF file")
    github_url: str | None = None
    portfolio_url: str | None = None
    # Input-only SkillItem (name + years): Laravel sends the skill
    # name and how many years of experience the user reported for it, JSON-encoded
    # as a single form field (e.g. '[{"name":"Docker","years":1}]').
    additional_skills: list[SkillItem] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")
