import { EntityNotFoundError, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

export type DeleteExperienceInput = {
  experienceId: string;
};

export class DeleteExperience {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

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
