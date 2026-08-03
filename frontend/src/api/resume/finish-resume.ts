import { httpClient } from "@/api/client";

export interface FinishResumeInput {
  user_resume_id: string;
  header: Record<string, unknown>;
  experiences?: unknown[];
  projects?: unknown[];
  qualifications?: unknown[];
  skills?: unknown[];
  languages?: unknown[];
  others?: Record<string, unknown> | unknown[];
}

export interface FinishResumeResponse {
  message: string;
}

export async function finishResume(
  payload: FinishResumeInput,
): Promise<FinishResumeResponse> {
  const { data } = await httpClient.post<FinishResumeResponse>(
    `/client/resumes/${payload.user_resume_id}/finish`,
    payload,
  );

  return data;
}