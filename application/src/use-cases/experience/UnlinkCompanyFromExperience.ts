import { Inject, Injectable } from '@nestjs/common';
import {
  EntityNotFoundError,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result
} from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type UnlinkCompanyFromExperienceInput = {
  experienceId: string;
};

@Injectable()
export class UnlinkCompanyFromExperience {
  public constructor(
    @Inject(DI.Experience.Repository) private readonly experienceRepository: ExperienceRepository
  ) {}

  public async execute(input: UnlinkCompanyFromExperienceInput): Promise<Result<ExperienceDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    experience.unlinkCompany();
    await this.experienceRepository.save(experience);

    return ok(toExperienceDto(experience));
  }
}
