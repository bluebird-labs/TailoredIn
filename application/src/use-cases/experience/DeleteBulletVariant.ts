import { type Bullet, type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

export type DeleteBulletVariantInput = {
  experienceId: string;
  bulletId: string;
  variantId: string;
};

export class DeleteBulletVariant {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteBulletVariantInput): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    let bullet: Bullet;
    try {
      bullet = experience.findBulletOrFail(input.bulletId);
    } catch {
      return err(new Error(`Bullet not found: ${input.bulletId}`));
    }

    try {
      bullet.removeVariant(input.variantId);
    } catch {
      return err(new Error(`Variant not found: ${input.variantId}`));
    }

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
