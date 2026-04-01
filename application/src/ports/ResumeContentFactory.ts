import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type MakeResumeContentInput = {
  profileId: string;
  archetypeId: string;
  awesomeColor: string;
  keywords: string[];
};

export interface ResumeContentFactory {
  make(input: MakeResumeContentInput): Promise<ResumeContentDto>;
}
