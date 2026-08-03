import { httpClient } from "@/api/client";

export interface ResetPasswordType {
  otp: string;
  password: string;
  password_confirm: string;
}

export async function resetPassword(data: ResetPasswordType): Promise<unknown> {
  const { data: res } = await httpClient.post("/auth/reset-password", data);

  return res;
}