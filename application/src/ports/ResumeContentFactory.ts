import type { Archetype } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type MakeResumeContentInput = {
  userId: string;
  archetype: Archetype;
  awesomeColor: string;
  keywords: string[];
};

export interface ResumeContentFactory {
  make(input: MakeResumeContentInput): Promise<ResumeContentDto>;
}
