import { ExperienceGenerationOverride, type ExperienceGenerationOverrideRepository } from '@tailoredin/domain';
import type { ExperienceGenerationOverrideDto } from '../../dtos/ExperienceGenerationOverrideDto.js';
import { toExperienceGenerationOverrideDto } from '../../dtos/ExperienceGenerationOverrideDto.js';

export type SetExperienceGenerationOverrideInput = {
  experienceId: string;
  bulletMin: number;
  bulletMax: number;
};

export class SetExperienceGenerationOverride {
  public constructor(private readonly experienceGenerationOverrideRepository: ExperienceGenerationOverrideRepository) {}

  public async execute(input: SetExperienceGenerationOverrideInput): Promise<ExperienceGenerationOverrideDto> {
    let override = await this.experienceGenerationOverrideRepository.findByExperienceId(input.experienceId);
    if (override) {
      override.updateBulletRange(input.bulletMin, input.bulletMax);
    } else {
      override = ExperienceGenerationOverride.create({
        experienceId: input.experienceId,
        bulletMin: input.bulletMin,
        bulletMax: input.bulletMax
      });
    }
    await this.experienceGenerationOverrideRepository.save(override);
    return toExperienceGenerationOverrideDto(override);
  }
}
