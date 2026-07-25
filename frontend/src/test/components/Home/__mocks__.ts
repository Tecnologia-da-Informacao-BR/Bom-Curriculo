import type { UserType } from '@/types/user-type';
import {vi} from 'vitest'
export const resumeCardMock1 = {
  id: 'resume-1',
  fileName: 'curriculo-backend.pdf',
  matchPercentage: 82,
  updatedLabel: '03/07/2026',
  tags: ['Node.js', 'TypeScript', 'NestJS', 'PostgreSQL', 'Docker'],
  maxVisibleTags: 3,
  limit: 5,
  onDownload: vi.fn(),
  onMatch: vi.fn(),
  onDelete: vi.fn(),
  onDeleteResume: vi.fn(),
};

export const userMock: UserType = {
  name: "Usuário Teste",
  email: "usuario.teste@example.com",
  email_verified_at: true,
  created_at: "2026-07-25T10:00:00.000Z",
  updated_at: "2026-07-25T10:00:00.000Z",
  github_link: "https://github.com/usuario-teste",
  site_link: null,
  social_name: "Usuário",
  phone: "11999999999",
  resume: "curriculo-teste.pdf",
  resume_email: "curriculo@example.com",
  gender: "Não informado",
  is_pcd: 0,
  city: "São Paulo",
  state: "SP",
  country: "Brasil",
  linkedin_link: "https://www.linkedin.com/in/usuario-teste",
  skills: [],
  experiences: [],
  qualifications: [],
  languages: [],
};