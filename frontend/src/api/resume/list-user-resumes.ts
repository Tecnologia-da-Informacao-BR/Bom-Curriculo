import { httpClient } from "@/api/client";
import type { UserResume } from "@/types/resume";

export interface ListUserResumesResponse {
  data: UserResume[];
}

export async function listUserResumes(): Promise<UserResume[]> {
  const { data } = await httpClient.get<{ data: ListUserResumesResponse }>(
    "/client/user/resumes",
  );

  return data.data.data;
}