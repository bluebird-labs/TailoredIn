import { CompanyId, type Accomplishment, type CompanyRepository, type Experience, type ExperienceRepository } from '@tailoredin/domain';
import type { AccomplishmentDto, ExperienceDto } from '../../dtos/ExperienceDto.js';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export class ListExperiences {
  public constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  public async execute(): Promise<ExperienceDto[]> {
    const experiences = await this.experienceRepository.findAll();
    const companyIds = [...new Set(experiences.map(e => e.companyId).filter(Boolean))] as string[];
    const companies = await Promise.all(companyIds.map(id => this.companyRepository.findById(new CompanyId(id))));
    const companyMap = new Map<string, CompanyDto>();
    for (const company of companies) {
      if (company) companyMap.set(company.id.value, toCompanyDto(company));
    }
    return experiences.map(exp => toExperienceDto(exp, exp.companyId ? companyMap.get(exp.companyId) : null));
  }
}

export function toExperienceDto(exp: Experience, company?: CompanyDto | null): ExperienceDto {
  return {
    id: exp.id.value,
    title: exp.title,
    companyName: exp.companyName,
    companyWebsite: exp.companyWebsite,
    companyId: exp.companyId,
    company: company ?? null,
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    summary: exp.summary,
    ordinal: exp.ordinal,
    accomplishments: exp.accomplishments.map(toAccomplishmentDto)
  };
}

function toAccomplishmentDto(accomplishment: Accomplishment): AccomplishmentDto {
  return {
    id: accomplishment.id.value,
    title: accomplishment.title,
    narrative: accomplishment.narrative,
    ordinal: accomplishment.ordinal
  };
}
