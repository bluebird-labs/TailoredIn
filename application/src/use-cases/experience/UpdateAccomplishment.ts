import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

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
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    let acc: ReturnType<Experience['findAccomplishmentOrFail']>;
    try {
      acc = experience.findAccomplishmentOrFail(input.accomplishmentId);
    } catch {
      return err(new Error(`Accomplishment not found: ${input.accomplishmentId}`));
    }

    acc.update({ title: input.title, narrative: input.narrative, ordinal: input.ordinal });
    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
