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

export type DeleteAccomplishmentInput = {
  experienceId: string;
  accomplishmentId: string;
};

@Injectable()
export class DeleteAccomplishment {
  public constructor(@Inject(DI.Experience.Repository) private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteAccomplishmentInput): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    try {
      experience.removeAccomplishment(input.accomplishmentId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
