import { httpClient } from "@/api/client";
import type {
  UserSkill,
  UserExperience,
  UserQualification,
  UserLanguage,
  UserProject,
} from "@/types/user-type";

export interface UpdateUserInput {
  name?: string;
  social_name?: string | null;
  phone?: string | null;
  resume_email?: string | null;
  github_link?: string | null;
  site_link?: string | null;
  linkedin_link?: string | null;
  gender?: string | null;
  is_pcd?: boolean;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  resume_cv?: File | null;
  resume_linkedin?: File | null;
  path_certificate_pcd?: File | null;
  skills?: UserSkill[];
  experiences?: UserExperience[];
  qualifications?: UserQualification[];
  languages?: UserLanguage[];
  projects?: UserProject[];
}

export async function updateUser(
  payload: UpdateUserInput,
): Promise<{ user: import("@/types/user-type").UserType }> {
  const formData = new FormData();

  const scalarKeys: Array<keyof UpdateUserInput> = [
    "name",
    "social_name",
    "phone",
    "resume_email",
    "github_link",
    "site_link",
    "linkedin_link",
    "gender",
    "city",
    "state",
    "country",
  ];

  scalarKeys.forEach((key) => {
    const value = payload[key];
    if (value === undefined || value === null) return;
    formData.append(key, String(value));
  });

  if (payload.is_pcd !== undefined) {
    formData.append("is_pcd", payload.is_pcd ? "1" : "0");
  }

  if (payload.resume_cv) formData.append("resume_cv", payload.resume_cv);
  if (payload.resume_linkedin) {
    formData.append("resume_linkedin", payload.resume_linkedin);
  }
  if (payload.path_certificate_pcd) {
    formData.append("path_certificate_pcd", payload.path_certificate_pcd);
  }

  const collections: Array<{ key: string; items?: unknown[] }> = [
    { key: "skills", items: payload.skills },
    { key: "experiences", items: payload.experiences },
    { key: "qualifications", items: payload.qualifications },
    { key: "languages", items: payload.languages },
    { key: "projects", items: payload.projects },
  ];

  collections.forEach(({ key, items }) => {
    items?.forEach((item, index) => {
      const record = { ...(item as Record<string, unknown>) };
      delete record.id;
      delete record.user_id;
      Object.entries(record).forEach(([field, value]) => {
        if (value === undefined || value === null || value === "") return;
        formData.append(`${key}[${index}][${field}]`, String(value));
      });
    });
  });

  const { data } = await httpClient.put<{
    data: { user: import("@/types/user-type").UserType };
  }>("/client/user/update", formData);

  return data.data;
}