import {
  CompanyId,
  type CompanyRepository,
  EntityNotFoundError,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result
} from '@tailoredin/domain';
import { toCompanyDto } from '../../dtos/CompanyDto.js';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type LinkCompanyToExperienceInput = {
  experienceId: string;
  companyId: string;
};

export class LinkCompanyToExperience {
  public constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  public async execute(input: LinkCompanyToExperienceInput): Promise<Result<ExperienceDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    const company = await this.companyRepository.findById(new CompanyId(input.companyId));
    if (!company) return err(new EntityNotFoundError('Company', input.companyId));

    experience.linkCompany(input.companyId);
    await this.experienceRepository.save(experience);

    return ok(toExperienceDto(experience, toCompanyDto(company)));
  }
}
