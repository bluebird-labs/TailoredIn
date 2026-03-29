import { Archetype } from '@tailoredin/db';
import type { BrilliantCVContent } from '../../brilliant-cv/types.js';
import { LeadICResumeTemplate } from './LeadICResumeTemplate.js';
import { ResumeTemplateParser } from './ResumeTemplateParser.js';
import type { ResumeTemplate } from './types.js';

export type MakeResumeContentInput = {
  archetype: Archetype;
  awesome_color: string;
  keywords: string[];
};

export const makeResumeContent = (input: MakeResumeContentInput): BrilliantCVContent => {
  const { archetype } = input;

  let config: ResumeTemplate;

  switch (archetype) {
    case Archetype.IC:
    case Archetype.LEAD_IC:
      config = LeadICResumeTemplate;
      break;
    default:
      config = LeadICResumeTemplate;
  }

  const data = ResumeTemplateParser.parse(config);

  return {
    personal: {
      first_name: 'Sylvain',
      last_name: 'Estevez',
      email: 'estevez.sylvain@gmail.com',
      phone: '+1 415 619 7821',
      github: 'SylvainEstevez',
      linkedin: 'sylvain-estevez',
      location: 'New York, NY',
      header_quote: data.headline
    },
    awesome_color: input.awesome_color,
    keywords: input.keywords,
    experience: data.experience,
    skills: data.skills,
    education: data.education
  };
};
