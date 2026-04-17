import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundError, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';
import { DI } from '../../DI.js';

export type DeleteExperienceInput = {
  experienceId: string;
};

@Injectable()
export class DeleteExperience {
  public constructor(@Inject(DI.Experience.Repository) private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteExperienceInput): Promise<Result<void, Error>> {
    try {
      await this.experienceRepository.delete(input.experienceId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }
    return ok(undefined);
  }
}
