import {
  type GenerationScope,
  GenerationSettings,
  type GenerationSettingsRepository,
  type ModelTier
} from '@tailoredin/domain';
import type { GenerationSettingsDto } from '../../dtos/GenerationSettingsDto.js';
import { toGenerationSettingsDto } from '../../dtos/GenerationSettingsDto.js';

export type UpdateGenerationSettingsInput = {
  profileId: string;
  modelTier?: ModelTier;
  bulletMin?: number;
  bulletMax?: number;
  prompts?: Array<{ scope: GenerationScope; content: string | null }>;
};

export class UpdateGenerationSettings {
  public constructor(private readonly generationSettingsRepository: GenerationSettingsRepository) {}

  public async execute(input: UpdateGenerationSettingsInput): Promise<GenerationSettingsDto> {
    let settings = await this.generationSettingsRepository.findByProfileId(input.profileId);
    if (!settings) {
      settings = GenerationSettings.createDefault(input.profileId);
    }

    if (input.modelTier !== undefined) {
      settings.updateModelTier(input.modelTier);
    }

    if (input.bulletMin !== undefined || input.bulletMax !== undefined) {
      settings.updateBulletRange(input.bulletMin ?? settings.bulletMin, input.bulletMax ?? settings.bulletMax);
    }

    if (input.prompts) {
      for (const prompt of input.prompts) {
        if (prompt.content === null) {
          settings.removePrompt(prompt.scope);
        } else {
          settings.setPrompt(prompt.scope, prompt.content);
        }
      }
    }

    await this.generationSettingsRepository.save(settings);
    return toGenerationSettingsDto(settings);
  }
}
