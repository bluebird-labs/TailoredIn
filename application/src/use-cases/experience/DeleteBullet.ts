import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

export type DeleteBulletInput = {
  experienceId: string;
  bulletId: string;
};

// TODO(Task 9): Replace with DeleteAccomplishment use case
export class DeleteBullet {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteBulletInput): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    try {
      experience.removeAccomplishment(input.bulletId);
    } catch {
      return err(new Error(`Accomplishment not found: ${input.bulletId}`));
    }

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
