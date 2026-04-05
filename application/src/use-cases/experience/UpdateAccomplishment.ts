import {
  EntityNotFoundError,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result
} from '@tailoredin/domain';

export type UpdateAccomplishmentInput = {
  experienceId: string;
  accomplishmentId: string;
  title?: string;
  narrative?: string;
  ordinal?: number;
};

export class UpdateAccomplishment {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateAccomplishmentInput): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    let acc: ReturnType<Experience['findAccomplishmentOrFail']>;
    try {
      acc = experience.findAccomplishmentOrFail(input.accomplishmentId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    acc.update({ title: input.title, narrative: input.narrative, ordinal: input.ordinal });
    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
