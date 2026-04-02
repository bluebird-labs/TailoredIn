import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type RenderResumeInput = {
  content: ResumeContentDto;
  companyName: string;
};

export interface ResumeRenderer {
  render(input: RenderResumeInput): Promise<string>;
}
