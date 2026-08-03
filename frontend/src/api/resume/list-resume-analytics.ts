import { httpClient } from "@/api/client";
import type { ResumeAnalytic } from "@/types/resume";

export async function listResumeAnalytics(): Promise<ResumeAnalytic[]> {
  const { data } = await httpClient.get<{ data: ResumeAnalytic[] }>(
    "/client/resumes/pendings",
  );

  return data.data;
}