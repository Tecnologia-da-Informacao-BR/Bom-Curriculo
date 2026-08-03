import { httpClient, setToken } from "@/api/client";
import type { RegisterType } from "@/types/register-type";
import type { UserType } from "@/types/user-type";

export interface RegisterResponse {
  token: string;
  user: UserType;
}

export async function RegisterApi(
  dataRegister: RegisterType,
): Promise<RegisterResponse> {
  const { data } = await httpClient.post<{ data: RegisterResponse }>(
    "/auth/register",
    dataRegister,
  );

  setToken(data.data.token);

  return data.data;
}