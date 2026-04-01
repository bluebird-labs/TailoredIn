import type { TagDto } from './TagDto.js';

export type HeadlineDto = {
  id: string;
  label: string;
  summaryText: string;
  roleTags: TagDto[];
};
