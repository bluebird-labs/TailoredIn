import { injectable } from '@needle-di/core';
import type { MakeResumeContentInput, ResumeContentDto, ResumeContentFactory } from '@tailoredin/application';
import { Archetype } from '@tailoredin/domain';
import { LeadICResumeTemplate } from '../resume/templates/LeadICResumeTemplate.js';
import { ResumeTemplateParser } from '../resume/templates/ResumeTemplateParser.js';
import type { ResumeTemplate } from '../resume/templates/types.js';

@injectable()
export class TemplateResumeContentFactory implements ResumeContentFactory {
  make(input: MakeResumeContentInput): ResumeContentDto {
    const { archetype, awesomeColor, keywords } = input;

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
      awesome_color: awesomeColor,
      keywords,
      experience: data.experience,
      skills: data.skills,
      education: data.education
    };
  }
}
