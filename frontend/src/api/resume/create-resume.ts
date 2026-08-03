import { httpClient } from "@/api/client";

export interface CreateResumeSkill {
  name: string;
  years?: number;
}

export interface SendResumeInput {
  resume_cv?: File | null;
  resume_linkedin?: File | null;
  github_link?: string;
  site_link?: string;
  skills?: CreateResumeSkill[];
}

export interface SendResumeResponse {
  message: string;
}

export async function createResume(
  payload: SendResumeInput,
): Promise<SendResumeResponse> {
  const formData = new FormData();

  if (payload.resume_cv) formData.append("resume_cv", payload.resume_cv);
  if (payload.resume_linkedin) {
    formData.append("resume_linkedin", payload.resume_linkedin);
  }
  if (payload.github_link) formData.append("github_link", payload.github_link);
  if (payload.site_link) formData.append("site_link", payload.site_link);

  payload.skills?.forEach((skill, index) => {
    formData.append(`skills[${index}][name]`, skill.name);
    if (skill.years !== undefined) {
      formData.append(`skills[${index}][years]`, String(skill.years));
    }
  });

  const { data } = await httpClient.post<SendResumeResponse>(
    "/client/resumes/new-resume",
    formData,
  );

  return data;
}