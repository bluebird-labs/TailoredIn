import { BrilliantCVEducation, BrilliantCVExperience, BrilliantCVSkill } from '../../brilliant-cv/types.js';
import { ResumeConfig, ResumeData }                                      from './types.js';
import { StringUtil }                                                    from '@tailoredin/shared';
import { formatDateRange }                                               from '../dateFormatter.js';
import { capitalize }                                                    from 'lodash';

export abstract class CVConfigParser {
  public static parse(config: ResumeConfig): ResumeData {
    return {
      headline: config.headline,
      experience: CVConfigParser.parseExperience(config.experience),
      skills: CVConfigParser.parseStack(config.stack),
      education: CVConfigParser.parseEducation(config.education)
    };
  }

  public static parseExperience(config: ResumeConfig['experience']): BrilliantCVExperience[] {
    if (config.length < 1) {
      throw new Error(`No experience in config.`);
    }

    return config.map(experience => {
      if (!experience.highlights || experience.highlights.length < 2) {
        throw new Error(`Not enough highlights in experience: ${experience.summary}`);
      }

      return {
        title: experience.position,
        society: experience.company,
        date: formatDateRange(experience.start_date, experience.end_date),
        location: experience.location,
        summary: experience.summary,
        highlights: experience.highlights.map(h => StringUtil.ensureEndsWith(h, '.'))
      };
    });
  }

  public static parseStack(config: ResumeConfig['stack']): BrilliantCVSkill[] {
    return Object.entries(config).map(([category, items]) => ({
      type: capitalize(category),
      info: items.map(item => item.replace(/#/g, '\\#')).join(' #h-bar() ')
    }));
  }

  public static parseEducation(config: ResumeConfig['education']): BrilliantCVEducation[] {
    if (config.length < 1) {
      throw new Error(`No education in config.`);
    }

    return config.map(education => {
      switch (education) {
        case 'BS':
          return {
            title: 'B.S. in Computer Science',
            society: 'AFPA Créteil',
            date: '2012',
            location: 'Paris, France'
          };
        case 'Cert':
          return {
            title: 'Certification in Modern Management Techniques',
            society: 'CNFDI Paris',
            date: '2008',
            location: 'Paris, France'
          };
        case 'HS':
          return {
            title: 'High School Diploma in Electronics',
            society: 'Lycée de la Mare Carrée',
            date: '2003',
            location: 'Moissy-Cramayel, France'
          };
        default:
          throw new Error(`Unmapped education: ${education}`);
      }
    });
  }
}
