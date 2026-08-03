import { httpClient } from "@/api/client";

export interface EnumOption {
  value: string;
}

export interface EnumsResponse {
  user_gender: EnumOption[];
  user_language_level: EnumOption[];
  user_qualification_type: EnumOption[];
}

export async function getEnums(): Promise<EnumsResponse> {
  const { data } = await httpClient.get<{ data: EnumsResponse }>("/enums");
  return data.data;
}