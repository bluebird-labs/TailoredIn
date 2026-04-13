import type {
  Accomplishment,
  CompanyRepository,
  Experience,
  ExperienceRepository,
  SkillRepository
} from '@tailoredin/domain';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';
import type { AccomplishmentDto, ExperienceDto } from '../../dtos/ExperienceDto.js';
import type { ExperienceSkillDto } from '../../dtos/ExperienceSkillDto.js';
import { toSkillDto } from '../../dtos/SkillDto.js';

export class ListExperiences {
  public constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly skillRepository: SkillRepository
  ) {}

  public async execute(): Promise<ExperienceDto[]> {
    const experiences = await this.experienceRepository.findAll();
    const companyIds = [...new Set(experiences.map(e => e.companyId).filter(Boolean))] as string[];
    const companies = await Promise.all(companyIds.map(id => this.companyRepository.findById(id)));
    const companyMap = new Map<string, CompanyDto>();
    for (const company of companies) {
      if (company) companyMap.set(company.id, toCompanyDto(company));
    }

    // Resolve all skills across all experiences in one batch
    const allSkillIds = [...new Set(experiences.flatMap(e => e.skills.getItems().map(es => es.skillId)))];
    const skills = allSkillIds.length > 0 ? await this.skillRepository.findByIds(allSkillIds) : [];
    const skillMap = new Map(skills.map(s => [s.id, s]));

    return experiences.map(exp => {
      const experienceSkills: ExperienceSkillDto[] = exp.skills.getItems().map(es => ({
        id: es.id,
        skillId: es.skillId,
        skill: toSkillDto(skillMap.get(es.skillId)!)
      }));
      return toExperienceDto(exp, exp.companyId ? companyMap.get(exp.companyId) : null, experienceSkills);
    });
  }
}

export function toExperienceDto(
  exp: Experience,
  company?: CompanyDto | null,
  skills: ExperienceSkillDto[] = []
): ExperienceDto {
  return {
    id: exp.id,
    title: exp.title,
    companyName: exp.companyName,
    companyWebsite: exp.companyWebsite,
    companyAccent: exp.companyAccent,
    companyId: exp.companyId,
    company: company ?? null,
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    summary: exp.summary,
    ordinal: exp.ordinal,
    bulletMin: exp.bulletMin,
    bulletMax: exp.bulletMax,
    accomplishments: exp.accomplishments.map(toAccomplishmentDto),
    skills
  };
}

function toAccomplishmentDto(accomplishment: Accomplishment): AccomplishmentDto {
  return {
    id: accomplishment.id,
    title: accomplishment.title,
    narrative: accomplishment.narrative,
    ordinal: accomplishment.ordinal
  };
}
