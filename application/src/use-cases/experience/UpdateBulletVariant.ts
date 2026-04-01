import {
  type Bullet,
  type BulletVariant,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result,
  TagSet
} from '@tailoredin/domain';

export type UpdateBulletVariantInput = {
  experienceId: string;
  bulletId: string;
  variantId: string;
  text: string;
  angle: string;
  roleTags: string[];
  skillTags: string[];
};

export class UpdateBulletVariant {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateBulletVariantInput): Promise<Result<void, Error>> {
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

    variant.text = input.text;
    variant.angle = input.angle;
    variant.tags = new TagSet({ roleTags: input.roleTags, skillTags: input.skillTags });
    variant.updatedAt = new Date();

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
