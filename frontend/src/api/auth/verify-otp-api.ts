import { httpClient } from "@/api/client";

export interface VerifyOtpType {
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  user_id: number;
}

export async function verifyOtp(data: VerifyOtpType): Promise<VerifyOtpResponse> {
  const { data: res } = await httpClient.post<{
    data: VerifyOtpResponse;
  }>("/auth/verify-otp", data);

  return res.data;
}