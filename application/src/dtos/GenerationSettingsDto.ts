import type { ExperienceGenerationOverride, GenerationSettings } from '@tailoredin/domain';

export type GenerationPromptDto = {
  readonly id: string;
  readonly scope: string;
  readonly content: string;
};

export type ExperienceOverrideDto = {
  readonly experienceId: string;
  readonly bulletMin: number;
  readonly bulletMax: number;
};

export type GenerationSettingsDto = {
  readonly id: string;
  readonly profileId: string;
  readonly modelTier: string;
  readonly bulletMin: number;
  readonly bulletMax: number;
  readonly prompts: GenerationPromptDto[];
  readonly experienceOverrides: ExperienceOverrideDto[];
};

export function toGenerationSettingsDto(
  settings: GenerationSettings,
  overrides: ExperienceGenerationOverride[] = []
): GenerationSettingsDto {
  return {
    id: settings.id.value,
    profileId: settings.profileId,
    modelTier: settings.modelTier,
    bulletMin: settings.bulletMin,
    bulletMax: settings.bulletMax,
    prompts: settings.prompts.map(p => ({
      id: p.id.value,
      scope: p.scope,
      content: p.content
    })),
    experienceOverrides: overrides.map(o => ({
      experienceId: o.experienceId,
      bulletMin: o.bulletMin,
      bulletMax: o.bulletMax
    }))
  };
}
