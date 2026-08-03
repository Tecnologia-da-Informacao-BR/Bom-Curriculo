export interface UserSkill {
  id?: number;
  user_id?: number;
  name: string;
  years?: string | number | null;
}

export interface UserExperience {
  id?: number;
  user_id?: number;
  company: string;
  role: string;
  start: string;
  end?: string | null;
  description?: string | null;
  is_actual?: boolean;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export type UserQualificationType =
  | "elementary_education"
  | "high_school"
  | "extracurricular_course"
  | "technical_course"
  | "undergraduate_degree"
  | "postgraduate_degree"
  | "master_degree"
  | "doctorate_degree";

export interface UserQualification {
  id?: number;
  type: UserQualificationType | string;
  institution: string;
  title: string;
  start: string;
  end?: string | null;
  is_coursing?: boolean;
}

export type UserLanguageLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "fluent"
  | "native";

export interface UserLanguage {
  id?: number;
  language: string;
  level: UserLanguageLevel | string;
}

export interface UserProject {
  id?: number;
  user_id?: number;
  title: string;
  date: string;
  technologies?: string;
  description?: string;
  url?: string;
}

export type UserGender = "male" | "female" | "another";

export interface UserType {
  id: number;
  name: string;
  social_name?: string | null;
  email: string;
  resume_email?: string | null;
  email_verified_at?: string | null;
  phone?: string | null;
  resume_cv?: string | null;
  resume_linkedin?: string | null;
  github_link?: string | null;
  linkedin_link?: string | null;
  site_link?: string | null;
  gender?: UserGender | null;
  is_pcd?: boolean;
  path_certificate_pcd?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  created_at: string;
  updated_at: string;
  skills: UserSkill[];
  experiences: UserExperience[];
  qualifications: UserQualification[];
  languages: UserLanguage[];
  projects: UserProject[];
}