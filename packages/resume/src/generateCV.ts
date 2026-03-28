import { BrilliantCVContent } from '../brilliant-cv/types.js';
import { Archetype }          from '@tailoredin/db';
import { makeCV }             from './cvs/makeCV.js';

export type GenerateCVInput = {
  awesomeColor: string;
  companyName: string;
  archetype: Archetype;
  keywords: string[];
};

export const generateCV = (input: GenerateCVInput): BrilliantCVContent => {
  return makeCV({
    archetype: input.archetype,
    awesome_color: input.awesomeColor,
    keywords: input.keywords
  });
};
