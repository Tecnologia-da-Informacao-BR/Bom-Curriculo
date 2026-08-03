import { httpClient } from "@/api/client";
import type { UserType } from "@/types/user-type";

export async function getUser(): Promise<UserType> {
  const { data } = await httpClient.get<{ data: { user: UserType } }>(
    "/client/user",
  );

  return data.data.user;
}