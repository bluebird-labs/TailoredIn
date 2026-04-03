import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';
import type { AccomplishmentDto } from '../../dtos/AccomplishmentDto.js';

export type AddAccomplishmentInput = {
  experienceId: string;
  title: string;
  narrative: string;
  skillTags: string[];
  ordinal: number;
};

export class AddAccomplishment {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: AddAccomplishmentInput): Promise<Result<AccomplishmentDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const acc = experience.addAccomplishment({
      title: input.title,
      narrative: input.narrative,
      skillTags: input.skillTags,
      ordinal: input.ordinal
    });
    await this.experienceRepository.save(experience);

    return ok({
      id: acc.id.value,
      title: acc.title,
      narrative: acc.narrative,
      skillTags: acc.skillTags,
      ordinal: acc.ordinal
    });
  }
}
