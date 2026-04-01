import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';
import type { BulletDto } from '../../dtos/ExperienceDto.js';

export type AddBullet2Input = {
  experienceId: string;
  content: string;
  ordinal: number;
};

export class AddBullet2 {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: AddBullet2Input): Promise<Result<BulletDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const bullet = experience.addBullet({ content: input.content, ordinal: input.ordinal });
    await this.experienceRepository.save(experience);

    return ok({
      id: bullet.id.value,
      content: bullet.content,
      ordinal: bullet.ordinal,
      roleTags: [],
      skillTags: [],
      variants: []
    });
  }
}
