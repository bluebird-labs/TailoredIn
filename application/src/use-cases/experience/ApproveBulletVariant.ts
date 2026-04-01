import {
  type Bullet,
  type BulletVariant,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result
} from '@tailoredin/domain';

export type ApproveBulletVariantInput = {
  experienceId: string;
  bulletId: string;
  variantId: string;
  action: 'approve' | 'reject';
};

export class ApproveBulletVariant {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: ApproveBulletVariantInput): Promise<Result<void, Error>> {
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

    let variant: BulletVariant;
    try {
      variant = bullet.findVariantOrFail(input.variantId);
    } catch {
      return err(new Error(`Variant not found: ${input.variantId}`));
    }

    if (input.action === 'approve') {
      variant.approve();
    } else {
      variant.reject();
    }

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
