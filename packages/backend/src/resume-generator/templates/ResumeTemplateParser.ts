import { BrilliantCVEducation, BrilliantCVExperience, BrilliantCVSkill } from '../../../brilliant-cv/types';
import { ResumeData, ResumeTemplate }                                    from './types';
import { StringUtil }                                                    from '../../utils/StringUtil';
import { formatDateRange }                                               from '../dateFormatter';
import { capitalize }                                                    from 'lodash';

export abstract class ResumeTemplateParser {
  public static parse(config: ResumeTemplate): ResumeData {
    return {
      headline: config.headline,
      experience: ResumeTemplateParser.parseExperience(config.experience),
      skills: ResumeTemplateParser.parseStack(config.stack),
      education: ResumeTemplateParser.parseEducation(config.education)
    };
  }

  public static parseExperience(config: ResumeTemplate['experience']): BrilliantCVExperience[] {
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

  public static parseStack(config: ResumeTemplate['stack']): BrilliantCVSkill[] {
    return Object.entries(config).map(([category, items]) => ({
      type: capitalize(category),
      info: items.map(item => item.replace(/#/g, '\\#')).join(' #h-bar() ')
    }));
  }

  public static parseEducation(config: ResumeTemplate['education']): BrilliantCVEducation[] {
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
