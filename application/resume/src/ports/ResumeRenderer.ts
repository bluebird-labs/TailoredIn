import type { Archetype } from '@tailoredin/domain-job';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type RenderResumeInput = {
  content: ResumeContentDto;
  companyName: string;
  archetype: Archetype;
};

export interface ResumeRenderer {
  render(input: RenderResumeInput): Promise<string>;
}
