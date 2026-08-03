import { httpClient } from "@/api/client";

export type ResumeFileType = "cv" | "linkedin" | "pcd";

export async function getResumeFile(
  type: ResumeFileType = "cv",
): Promise<string> {
  const { data } = await httpClient.get<{ data: { file_url: string } }>(
    "/client/resumes/files",
    { params: { type } },
  );

  return data.data.file_url;
}