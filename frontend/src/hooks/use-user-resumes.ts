import { useQuery } from "@tanstack/react-query";
import { listUserResumes } from "@/api/resume/list-user-resumes";
import { listResumeAnalytics } from "@/api/resume/list-resume-analytics";
import type { UserResume, ResumeAnalytic } from "@/types/resume";

export interface DashboardResume {
  id: string;
  analyticId: number | null;
  fileName: string;
  matchPercentage: number;
  updatedLabel: string;
  tags: string[];
  status: string;
  statusLabel: string;
  downloadUrl: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  analyze: "Em análise",
  ready: "Pronto",
  fail: "Falhou",
};

function fileNameFromResume(resume: UserResume): string {
  const raw =
    resume.original_file_path_cv ??
    resume.original_file_path_linkedin ??
    resume.processed_file_path;
  if (!raw) return "Currículo.pdf";
  const parts = raw.split("/");
  return parts[parts.length - 1] || "Currículo.pdf";
}

function relativeTime(date: string | null): string {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

function analyticScore(analytic: ResumeAnalytic | undefined): number {
  const score = analytic?.others?.score;
  if (typeof score === "number") return Math.max(0, Math.min(100, score));

  const numeric = typeof score === "string" ? Number(score) : NaN;
  if (!Number.isNaN(numeric)) return Math.max(0, Math.min(100, numeric));

  return 0;
}

function combine(
  resumes: UserResume[],
  analytics: ResumeAnalytic[],
): DashboardResume[] {
  const byResume = new Map<string, ResumeAnalytic>();
  analytics.forEach((analytic) => {
    if (analytic.user_resume_id) {
      byResume.set(analytic.user_resume_id, analytic);
    }
  });

  return resumes.map((resume) => {
    const analytic = byResume.get(resume.id);
    const tags = Array.isArray(analytic?.skills)
      ? analytic.skills
          .map((skill) => (typeof skill.name === "string" ? skill.name : ""))
          .filter(Boolean)
          .slice(0, 6)
      : [];

    const status = String(resume.status);

    return {
      id: resume.id,
      analyticId: analytic?.id ?? null,
      fileName: fileNameFromResume(resume),
      matchPercentage: analyticScore(analytic),
      updatedLabel: relativeTime(resume.updated_at),
      tags,
      status,
      statusLabel: STATUS_LABEL[status] ?? status,
      downloadUrl: resume.download_url,
    };
  });
}

export function useUserResumes() {
  const resumesQuery = useQuery({
    queryKey: ["user", "resumes"],
    queryFn: listUserResumes,
  });

  const analyticsQuery = useQuery({
    queryKey: ["resumes", "pendings"],
    queryFn: listResumeAnalytics,
  });

  const isLoading =
    resumesQuery.isLoading || analyticsQuery.isLoading;
  const isError =
    resumesQuery.isError || analyticsQuery.isError;

  const resumes = combine(
    resumesQuery.data ?? [],
    analyticsQuery.data ?? [],
  );

  return {
    resumes,
    userResumes: resumesQuery.data ?? [],
    analytics: analyticsQuery.data ?? [],
    isLoading,
    isError,
    refetch: () => {
      resumesQuery.refetch();
      analyticsQuery.refetch();
    },
  };
}