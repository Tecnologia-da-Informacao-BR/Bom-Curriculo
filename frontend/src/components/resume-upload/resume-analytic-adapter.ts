import type { ResumeAnalytic } from "@/types/resume";
import type { ReviewSection } from "@/components/resume-upload/ResumeReviewStage";

/** Turns the AI-analyzed data into the generic sections the checkbox UI renders. */
export function reviewSectionsFromAnalytic(analytic: ResumeAnalytic): ReviewSection[] {
  const sections: ReviewSection[] = [];

  if (analytic.experiences?.length) {
    sections.push({
      id: "experiences",
      title: "Experiências",
      items: analytic.experiences.map((experience, index) => ({
        id: `experience-${index}`,
        title: `${experience.role} — ${experience.company}`,
        description: [experience.start, experience.is_actual ? "atual" : experience.end]
          .filter(Boolean)
          .join(" até "),
      })),
    });
  }

  if (analytic.qualifications?.length) {
    sections.push({
      id: "qualifications",
      title: "Cursos e formação",
      items: analytic.qualifications.map((qualification, index) => ({
        id: `qualification-${index}`,
        title: qualification.title,
        description: qualification.institution,
      })),
    });
  }

  if (analytic.skills?.length) {
    sections.push({
      id: "skills",
      title: "Habilidades",
      items: analytic.skills.map((skill, index) => ({
        id: `skill-${index}`,
        title: skill.name,
        description: skill.years ? `${skill.years} anos de experiência` : undefined,
      })),
    });
  }

  if (analytic.languages?.length) {
    sections.push({
      id: "languages",
      title: "Idiomas",
      items: analytic.languages.map((language, index) => ({
        id: `language-${index}`,
        title: language.language,
        description: language.level,
      })),
    });
  }

  if (analytic.projects?.length) {
    sections.push({
      id: "projects",
      title: "Projetos",
      items: analytic.projects.map((project, index) => ({
        id: `project-${index}`,
        title: project.title,
        description: project.description ?? undefined,
      })),
    });
  }

  return sections;
}

/**
 * Rebuilds the finish-resume payload's arrays, keeping only the entries whose
 * generated id (see reviewSectionsFromAnalytic) is in selectedItemIds.
 */
export function filterAnalyticBySelection(analytic: ResumeAnalytic, selectedItemIds: string[]) {
  const selected = new Set(selectedItemIds);
  const keep = <T,>(items: T[] | undefined, prefix: string): T[] =>
    (items ?? []).filter((_, index) => selected.has(`${prefix}-${index}`));

  return {
    header: analytic.header ?? {},
    experiences: keep(analytic.experiences, "experience"),
    qualifications: keep(analytic.qualifications, "qualification"),
    skills: keep(analytic.skills, "skill"),
    languages: keep(analytic.languages, "language"),
    projects: keep(analytic.projects, "project"),
    others: analytic.others ?? {},
  };
}
