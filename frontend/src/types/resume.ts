export type UserResumeStatus = "pending" | "analyze" | "ready" | "fail";

export interface UserResume {
  id: string;
  user_id: number;
  original_file_path_cv: string | null;
  original_file_path_linkedin: string | null;
  processed_file_path: string | null;
  status: UserResumeStatus | string;
  processed_at: string | null;
  observation: string | null;
  download_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticHeader {
  name?: string | null;
  headline?: string | null;
  email?: string | null;
  location?: string | null;
  contacts?: string[] | string | null;
  emails?: string[] | null;
  links?: Record<string, string>;
  summary?: string | null;
  [key: string]: unknown;
}

export interface AnalyticExperience {
  company: string;
  role: string;
  start?: string | null;
  end?: string | null;
  description?: string | null;
  is_actual?: boolean | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  [key: string]: unknown;
}

export interface AnalyticProject {
  title: string;
  start?: string | null;
  end?: string | null;
  technologies?: string | string[] | null;
  description?: string | null;
  url?: string | null;
  [key: string]: unknown;
}

export interface AnalyticQualification {
  type: string;
  institution: string;
  title: string;
  start?: string | null;
  end?: string | null;
  is_coursing?: boolean | null;
  [key: string]: unknown;
}

export interface AnalyticSkill {
  name: string;
  years?: number | string | null;
  [key: string]: unknown;
}

export interface AnalyticLanguage {
  level: string;
  language: string;
  [key: string]: unknown;
}

export interface AnalyticOthers {
  score?: number | null;
  [key: string]: unknown;
}

export interface ResumeAnalytic {
  id: number;
  analysis_request_id: string | null;
  user_id: number;
  user_resume_id: string | null;
  status: string;
  error: unknown;
  header: AnalyticHeader | null;
  experiences: AnalyticExperience[];
  projects: AnalyticProject[];
  qualifications: AnalyticQualification[];
  skills: AnalyticSkill[];
  languages: AnalyticLanguage[];
  others: AnalyticOthers | null;
  created_at: string;
  updated_at: string;
}
