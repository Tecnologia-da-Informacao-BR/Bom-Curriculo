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

