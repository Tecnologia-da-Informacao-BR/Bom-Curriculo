import { describe, expect, it } from "vitest";
import { reviewSectionsFromAnalytic, filterAnalyticBySelection } from "@/components/resume-upload/resume-analytic-adapter";
import type { ResumeAnalytic } from "@/types/resume";

const analytic: ResumeAnalytic = {
  id: 1,
  analysis_request_id: null,
  user_id: 1,
  user_resume_id: "resume-uuid",
  status: "analyze",
  error: null,
  header: { name: "Pedro Aruanã" },
  experiences: [
    { company: "WhiteHats", role: "Dev", start: "2023-01", end: "2026-01", is_actual: false },
    { company: "Bom Currículo", role: "Voluntário", start: "2025-01", end: null, is_actual: true },
  ],
  qualifications: [
    { type: "higher_education", institution: "Uniasselvi", title: "Ciência da Computação" },
  ],
  skills: [
    { name: "PHP", years: 5 },
    { name: "React", years: 2 },
  ],
  languages: [{ language: "Inglês", level: "advanced" }],
  projects: [],
  others: { score: 85 },
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

describe("reviewSectionsFromAnalytic", () => {
  it("builds one section per non-empty category, skipping empty ones", () => {
    const sections = reviewSectionsFromAnalytic(analytic);
    const ids = sections.map((section) => section.id);

    expect(ids).toEqual(["experiences", "qualifications", "skills", "languages"]);
  });

  it("labels each item with the source's fields", () => {
    const [experiencesSection] = reviewSectionsFromAnalytic(analytic);

    expect(experiencesSection.items[0]).toEqual({
      id: "experience-0",
      title: "Dev — WhiteHats",
      description: "2023-01 até 2026-01",
    });
    expect(experiencesSection.items[1].description).toBe("2025-01 até atual");
  });
});

describe("filterAnalyticBySelection", () => {
  it("keeps only the selected entries in each array", () => {
    const filtered = filterAnalyticBySelection(analytic, ["experience-1", "skill-0"]);

    expect(filtered.experiences).toHaveLength(1);
    expect(filtered.experiences[0].company).toBe("Bom Currículo");
    expect(filtered.skills).toHaveLength(1);
    expect(filtered.skills[0].name).toBe("PHP");
    expect(filtered.qualifications).toHaveLength(0);
    expect(filtered.languages).toHaveLength(0);
  });

  it("always passes header and others through untouched", () => {
    const filtered = filterAnalyticBySelection(analytic, []);

    expect(filtered.header).toEqual({ name: "Pedro Aruanã" });
    expect(filtered.others).toEqual({ score: 85 });
  });
});
