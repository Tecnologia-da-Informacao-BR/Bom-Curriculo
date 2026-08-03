import { httpClient, setToken } from "@/api/client";
import type { UserType } from "@/types/user-type";
import type { LoginType } from "@/types/login-type";

export interface LoginResponse {
  token: string;
  user: UserType;
}

export async function LoginApi(dataLogin: LoginType): Promise<LoginResponse> {
  const { data } = await httpClient.post<{ data: LoginResponse }>(
    "/auth/login",
    dataLogin,
  );

  setToken(data.data.token);

  return data.data;
}