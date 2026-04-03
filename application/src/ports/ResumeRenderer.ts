import type { TemplateKey } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type RenderResumeInput = {
  content: ResumeContentDto;
  companyName: string;
  templateKey?: TemplateKey;
};

export interface ResumeRenderer {
  render(input: RenderResumeInput): Promise<string>;
}
