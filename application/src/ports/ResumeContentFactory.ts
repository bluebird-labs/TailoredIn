import type { Archetype } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type MakeResumeContentInput = {
  archetype: Archetype;
  awesomeColor: string;
  keywords: string[];
};

export interface ResumeContentFactory {
  make(input: MakeResumeContentInput): ResumeContentDto;
}
