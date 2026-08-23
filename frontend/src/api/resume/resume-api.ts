import { APICONNECTBACKEND } from "@/helpers/api-connect";
import type { ResumeUploadInput, UserResume } from "@/types/resume-type";

export const RESUMES_QUERY_KEY = ["resumes"] as const;

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = (await response.json()) as ApiResponse<T> & {
    data?: { error?: string; errors?: Record<string, string[]> };
  };

  if (!response.ok) {
    const validationMessage = payload.data?.errors
      ? Object.values(payload.data.errors).flat()[0]
      : undefined;
    throw new Error(payload.data?.error || validationMessage || payload.message || "Falha ao processar a solicitação.");
  }

  return payload as ApiResponse<T>;
}

export async function getResumes(): Promise<UserResume[]> {
  const response = await fetch(`${APICONNECTBACKEND}/client/user/resumes`, {
    headers: authHeaders(),
  });
  const payload = await readResponse<{ data: UserResume[] }>(response);

  return payload.data.data;
}

export async function uploadResume(input: ResumeUploadInput): Promise<UserResume> {
  const formData = new FormData();
  formData.append("resume_cv", input.resumeCv);

  if (input.resumeLinkedin) formData.append("resume_linkedin", input.resumeLinkedin);
  if (input.githubUrl) formData.append("github_link", input.githubUrl);
  if (input.portfolioUrl) formData.append("site_link", input.portfolioUrl);

  input.skills?.forEach((skill, index) => {
    formData.append(`skills[${index}][name]`, skill.name);
    if (skill.years !== null && skill.years !== undefined) {
      formData.append(`skills[${index}][years]`, String(skill.years));
    }
  });

  const response = await fetch(`${APICONNECTBACKEND}/client/resumes/new-resume`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  const payload = await readResponse<{ resume: UserResume }>(response);

  return payload.data.resume;
}
