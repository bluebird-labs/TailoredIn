import { BrilliantCVContent } from '../../brilliant-cv/types';
import { Archetype }          from './data/types';
import { makeCV }             from './cvs/makeCV';

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
