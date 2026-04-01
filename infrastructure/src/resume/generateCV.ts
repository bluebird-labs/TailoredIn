import type { ArchetypeKey } from '@tailoredin/domain';
import type { BrilliantCVContent } from '../brilliant-cv/types.js';
import { makeCV } from './cvs/makeCV.js';

export type GenerateCVInput = {
  awesomeColor: string;
  companyName: string;
  archetype: ArchetypeKey;
  keywords: string[];
};

export const generateCV = (input: GenerateCVInput): BrilliantCVContent => {
  return makeCV({
    archetype: input.archetype,
    awesome_color: input.awesomeColor,
    keywords: input.keywords
  });
};
