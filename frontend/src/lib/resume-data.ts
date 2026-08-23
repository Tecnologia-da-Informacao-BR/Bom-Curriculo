import type { ResumeCardProps } from "@/components/Home/ResumeCard";
import type { ReviewSection } from "@/components/resume-upload/ResumeReviewStage";
import type { ResumeAnalytic, UserResume } from "@/types/resume-type";

export type ResumeCardData = ResumeCardProps & { id: string };

export function resumeScore(analytic?: ResumeAnalytic | null): number | null {
  return analytic?.original_score ?? analytic?.score ?? null;
}

export function resumeFileName(resume: UserResume): string {
  return resume.original_file_name_cv
    || resume.original_file_name_linkedin
    || `Currículo ${resume.id.slice(0, 8)}`;
}

export function resumeDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function toResumeCard(resume: UserResume): ResumeCardData {
  return {
    id: resume.id,
    fileName: resumeFileName(resume),
    matchPercentage: resumeScore(resume.analytic),
    status: resume.status,
    updatedLabel: resumeDateLabel(resume.processed_at || resume.updated_at),
    tags: (resume.analytic?.skills || []).map((skill) => skill.name).filter(Boolean),
  };
}

function period(start?: string | null, end?: string | null, current = false): string | undefined {
  const values = [start, current ? "Atual" : end].filter(Boolean);
  return values.length > 0 ? values.join(" — ") : undefined;
}

export function toReviewSections(analytic?: ResumeAnalytic | null): ReviewSection[] {
  if (!analytic) return [];

  return [
    {
      id: "experiences",
      title: "Experiências",
      items: (analytic.experiences || []).map((experience, index) => ({
        id: `experience-${index}`,
        title: `${experience.role} — ${experience.company}`,
        description: period(experience.start, experience.end, Boolean(experience.is_actual)),
      })),
    },
    {
      id: "qualifications",
      title: "Formação",
      items: (analytic.qualifications || []).map((qualification, index) => ({
        id: `qualification-${index}`,
        title: qualification.title,
        description: qualification.institution,
      })),
    },
    {
      id: "projects",
      title: "Projetos",
      items: (analytic.projects || []).map((project, index) => ({
        id: `project-${index}`,
        title: project.title,
        description: project.technologies || project.description || undefined,
      })),
    },
    {
      id: "skills",
      title: "Habilidades",
      items: (analytic.skills || []).map((skill, index) => ({
        id: `skill-${index}`,
        title: skill.name,
        description: skill.years == null
          ? undefined
          : `${skill.years} ${skill.years === 1 ? "ano" : "anos"} de experiência`,
      })),
    },
    {
      id: "languages",
      title: "Idiomas",
      items: (analytic.languages || []).map((language, index) => ({
        id: `language-${index}`,
        title: language.language,
        description: language.level,
      })),
    },
  ].filter((section) => section.items.length > 0);
}
