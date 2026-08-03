import { httpClient } from "@/api/client";
import type { ResumeAnalytic } from "@/types/resume";

export async function getResumeAnalytic(id: string): Promise<ResumeAnalytic> {
  const { data } = await httpClient.get<{ data: ResumeAnalytic }>(
    `/client/resumes/pendings/${id}`,
  );

  return data.data;
}