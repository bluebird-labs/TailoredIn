import type { GenerationSettings } from '@tailoredin/domain';

export type GenerationPromptDto = {
  readonly id: string;
  readonly scope: string;
  readonly content: string;
};

export type GenerationSettingsDto = {
  readonly id: string;
  readonly profileId: string;
  readonly modelTier: string;
  readonly bulletMin: number;
  readonly bulletMax: number;
  readonly prompts: GenerationPromptDto[];
};

export function toGenerationSettingsDto(settings: GenerationSettings): GenerationSettingsDto {
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
    }))
  };
}
