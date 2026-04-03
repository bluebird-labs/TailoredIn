import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';
import type { AccomplishmentDto } from '../../dtos/ExperienceDto.js';

export type AddBulletInput = {
  experienceId: string;
  content: string;
  ordinal: number;
};

// TODO(Task 9): Replace with AddAccomplishment use case
export class AddBullet {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: AddBulletInput): Promise<Result<AccomplishmentDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const accomplishment = experience.addAccomplishment({
      title: input.content,
      narrative: input.content,
      skillTags: [],
      ordinal: input.ordinal,
    });
    await this.experienceRepository.save(experience);

    return ok({
      id: accomplishment.id.value,
      title: accomplishment.title,
      narrative: accomplishment.narrative,
      skillTags: accomplishment.skillTags,
      ordinal: accomplishment.ordinal,
    });
  }
}
