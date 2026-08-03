import { httpClient } from "@/api/client";
import type { ResumeAnalytic } from "@/types/resume";

export interface AnalyseResumeResponse {
  data: ResumeAnalytic[];
}

export async function analyseResume(
  userResumeId?: string | number,
): Promise<AnalyseResumeResponse> {
  const { data } = await httpClient.post<AnalyseResumeResponse>(
    "/client/services/bot/process",
    userResumeId ? { user_resume_id: userResumeId } : {},
  );

  return data;
}
