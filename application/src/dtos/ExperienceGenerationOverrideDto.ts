import type { ExperienceGenerationOverride } from '@tailoredin/domain';

export type ExperienceGenerationOverrideDto = {
  readonly id: string;
  readonly experienceId: string;
  readonly bulletMin: number;
  readonly bulletMax: number;
};

export function toExperienceGenerationOverrideDto(
  override: ExperienceGenerationOverride
): ExperienceGenerationOverrideDto {
  return {
    id: override.id,
    experienceId: override.experienceId,
    bulletMin: override.bulletMin,
    bulletMax: override.bulletMax
  };
}
