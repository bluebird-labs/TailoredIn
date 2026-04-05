import {
  EntityNotFoundError,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result
} from '@tailoredin/domain';
import type { AccomplishmentDto } from '../../dtos/AccomplishmentDto.js';

export type AddAccomplishmentInput = {
  experienceId: string;
  title: string;
  narrative: string;
  ordinal: number;
};

export class AddAccomplishment {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: AddAccomplishmentInput): Promise<Result<AccomplishmentDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    const acc = experience.addAccomplishment({
      title: input.title,
      narrative: input.narrative,
      ordinal: input.ordinal
    });
    await this.experienceRepository.save(experience);

    return ok({
      id: acc.id.value,
      title: acc.title,
      narrative: acc.narrative,
      ordinal: acc.ordinal
    });
  }
}
