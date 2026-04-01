import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';
import type { BulletDto } from '../../dtos/ExperienceDto.js';

export type AddBulletInput = {
  experienceId: string;
  content: string;
  ordinal: number;
};

export class AddBullet {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: AddBulletInput): Promise<Result<BulletDto, Error>> {
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
