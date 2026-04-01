import type { ArchetypeKey, TemplateStyle } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type RenderResumeInput = {
  content: ResumeContentDto;
  companyName: string;
  archetype: ArchetypeKey;
  templateStyle: TemplateStyle;
};

export interface ResumeRenderer {
  render(input: RenderResumeInput): Promise<string>;
}
