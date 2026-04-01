import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

export type UpdateBullet2Input = {
  experienceId: string;
  bulletId: string;
  content: string;
  ordinal: number;
};

export class UpdateBullet2 {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateBullet2Input): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    let bullet: ReturnType<Experience['findBulletOrFail']>;
    try {
      bullet = experience.findBulletOrFail(input.bulletId);
    } catch {
      return err(new Error(`Bullet not found: ${input.bulletId}`));
    }

    bullet.content = input.content;
    bullet.ordinal = input.ordinal;
    bullet.updatedAt = new Date();

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
