import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

export type DeleteBullet2Input = {
  experienceId: string;
  bulletId: string;
};

export class DeleteBullet2 {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteBullet2Input): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    try {
      experience.removeBullet(input.bulletId);
    } catch {
      return err(new Error(`Bullet not found: ${input.bulletId}`));
    }

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
