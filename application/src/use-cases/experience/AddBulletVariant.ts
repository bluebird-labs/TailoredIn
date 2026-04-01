import {
  type Bullet,
  type BulletVariantSource,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result,
  TagSet
} from '@tailoredin/domain';
import type { BulletVariantDto } from '../../dtos/ExperienceDto.js';

export type AddBulletVariantInput = {
  experienceId: string;
  bulletId: string;
  text: string;
  angle: string;
  source: BulletVariantSource;
  roleTags: string[];
  skillTags: string[];
};

export class AddBulletVariant {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: AddBulletVariantInput): Promise<Result<BulletVariantDto, Error>> {
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

    const variant = bullet.addVariant({
      text: input.text,
      angle: input.angle,
      tags: new TagSet({ roleTags: input.roleTags, skillTags: input.skillTags }),
      source: input.source
    });

    await this.experienceRepository.save(experience);

    return ok({
      id: variant.id.value,
      text: variant.text,
      angle: variant.angle,
      source: variant.source,
      approvalStatus: variant.approvalStatus,
      roleTags: [...variant.tags.roleTags].map(name => ({ id: '', name, dimension: 'ROLE' })),
      skillTags: [...variant.tags.skillTags].map(name => ({ id: '', name, dimension: 'SKILL' }))
    });
  }
}
