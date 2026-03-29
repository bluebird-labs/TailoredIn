import { injectable } from '@needle-di/core';
import { Archetype } from '@tailoredin/domain-job';
import type { MakeResumeContentInput, ResumeContentFactory } from '@tailoredin/application-resume';
import type { ResumeContentDto } from '@tailoredin/application-resume';
import { LeadICResumeTemplate } from '@tailoredin/resume/src/templates/LeadICResumeTemplate.js';
import { ResumeTemplateParser } from '@tailoredin/resume/src/templates/ResumeTemplateParser.js';
import type { ResumeTemplate } from '@tailoredin/resume/src/templates/types.js';

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
