import { CVConfigParser }    from './CVConfigParser';
import { BrilliantCVContent } from '../../../brilliant-cv/types';
import { Archetype }          from '../data/types';
import { ResumeConfig }       from './types';
import { NerdCVConfig }       from './NerdCVConfig';

export type MakeCVInput = {
  archetype: Archetype;
  awesome_color: string;
  keywords: string[];
};

export const makeCV = (input: MakeCVInput): BrilliantCVContent => {
  const { archetype } = input;

  let config: ResumeConfig;

  switch (archetype) {
    case Archetype.NERD:
      config = NerdCVConfig;
      break;
    default:
      throw new Error(`Unmapped archetype: ${archetype}`);
  }

  const data = CVConfigParser.parse(config);

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
