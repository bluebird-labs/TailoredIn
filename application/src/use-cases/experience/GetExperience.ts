import type { CompanyRepository, ExperienceRepository } from '@tailoredin/domain';
import { toCompanyDto } from '../../dtos/CompanyDto.js';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from '../experience/ListExperiences.js';

export type GetExperienceInput = {
  experienceId: string;
};

export class GetExperience {
  public constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  public async execute(input: GetExperienceInput): Promise<ExperienceDto> {
    const experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    const company = experience.companyId ? await this.companyRepository.findById(experience.companyId) : null;
    return toExperienceDto(experience, company ? toCompanyDto(company) : null);
  }
}
