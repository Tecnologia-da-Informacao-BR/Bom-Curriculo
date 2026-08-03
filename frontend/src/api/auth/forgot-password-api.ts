import { httpClient } from "@/api/client";
import type { ForgotPasswordType } from "@/types/forgot-password-type";

export interface ForgotPasswordResponse {
  expires_at: string;
}

export async function ForgotPasswordApi(
  data: ForgotPasswordType,
): Promise<ForgotPasswordResponse> {
  const { data: res } = await httpClient.post<{
    data: ForgotPasswordResponse;
  }>("/auth/forgot-password", data);

  return res.data;
}