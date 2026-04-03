import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

export type DeleteAccomplishmentInput = {
  experienceId: string;
  accomplishmentId: string;
};

export class DeleteAccomplishment {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteAccomplishmentInput): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    try {
      experience.removeAccomplishment(input.accomplishmentId);
    } catch {
      return err(new Error(`Accomplishment not found: ${input.accomplishmentId}`));
    }

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
