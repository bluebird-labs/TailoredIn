import type { ResumeTemplate } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type RenderResumeInput = {
  content: ResumeContentDto;
  companyName: string;
  template: ResumeTemplate;
};

export interface ResumeRenderer {
  render(input: RenderResumeInput): Promise<string>;
}
