import { httpClient, removeToken } from "@/api/client";

export async function LogoutApi(): Promise<true> {
  await httpClient.post("/auth/logout");

  removeToken();

  return true;
}