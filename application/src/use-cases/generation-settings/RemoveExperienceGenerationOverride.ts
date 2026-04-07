import type { ExperienceGenerationOverrideRepository } from '@tailoredin/domain';

export type RemoveExperienceGenerationOverrideInput = {
  experienceId: string;
};

export class RemoveExperienceGenerationOverride {
  public constructor(private readonly experienceGenerationOverrideRepository: ExperienceGenerationOverrideRepository) {}

  public async execute(input: RemoveExperienceGenerationOverrideInput): Promise<void> {
    await this.experienceGenerationOverrideRepository.delete(input.experienceId);
  }
}
