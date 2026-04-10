import { GenerationSettings, type GenerationSettingsRepository } from '@tailoredin/domain';
import type { GenerationSettingsDto } from '../../dtos/GenerationSettingsDto.js';
import { toGenerationSettingsDto } from '../../dtos/GenerationSettingsDto.js';

export type GetGenerationSettingsInput = {
  profileId: string;
};

export class GetGenerationSettings {
  public constructor(private readonly generationSettingsRepository: GenerationSettingsRepository) {}

  public async execute(input: GetGenerationSettingsInput): Promise<GenerationSettingsDto> {
    let settings = await this.generationSettingsRepository.findByProfileId(input.profileId);
    if (!settings) {
      settings = GenerationSettings.createDefault(input.profileId);
      await this.generationSettingsRepository.save(settings);
    }

    return toGenerationSettingsDto(settings);
  }
}
