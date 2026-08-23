export type ResumeStatus = "pending" | "analyze" | "ready" | "fail";

export interface ResumeHeader {
  name?: string | null;
  headline?: string | null;
  email?: string | null;
  location?: string | null;
  contacts?: string | null;
  emails?: string | null;
  links?: Record<string, string>;
}

export interface ResumeExperience {
  company: string;
  role: string;
  start?: string | null;
  end?: string | null;
  description?: string | null;
  is_actual?: boolean | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface ResumeProject {
  title: string;
  start?: string | null;
  end?: string | null;
  technologies?: string | null;
  description?: string | null;
  url?: string | null;
}

export interface ResumeQualification {
  type: string;
  institution: string;
  title: string;
  start?: string | null;
  end?: string | null;
  is_coursing?: boolean;
}

export interface ResumeSkill {
  name: string;
  years?: number | null;
}

export interface ResumeLanguage {
  level: string;
  language: string;
}

export interface ResumeAnalytic {
  id: number;
  analysis_request_id: string | null;
  user_resume_id: string;
  user_id: number;
  status: ResumeStatus;
  error: { message?: string } | null;
  original_score: number | null;
  score: number | null;
  suggestion: string | null;
  professional_summary: string | null;
  header: ResumeHeader | null;
  experiences: ResumeExperience[] | null;
  projects: ResumeProject[] | null;
  qualifications: ResumeQualification[] | null;
  skills: ResumeSkill[] | null;
  languages: ResumeLanguage[] | null;
  others: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UserResume {
  id: string;
  user_id: number;
  original_file_path_cv: string | null;
  original_file_name_cv: string | null;
  original_file_path_linkedin: string | null;
  original_file_name_linkedin: string | null;
  processed_file_path: string | null;
  status: ResumeStatus;
  processed_at: string | null;
  observation: string | null;
  created_at: string;
  updated_at: string;
  analytic: ResumeAnalytic | null;
}

export interface ResumeUploadInput {
  resumeCv: File;
  resumeLinkedin?: File | null;
  githubUrl?: string;
  portfolioUrl?: string;
  skills?: Array<{ name: string; years?: number | null }>;
}
