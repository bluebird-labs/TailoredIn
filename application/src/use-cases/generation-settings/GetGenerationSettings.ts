import { Inject, Injectable } from '@nestjs/common';
import { GenerationSettings, type GenerationSettingsRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { GenerationSettingsDto } from '../../dtos/GenerationSettingsDto.js';
import { toGenerationSettingsDto } from '../../dtos/GenerationSettingsDto.js';

export type GetGenerationSettingsInput = {
  profileId: string;
};

@Injectable()
export class GetGenerationSettings {
  public constructor(
    @Inject(DI.GenerationSettings.Repository)
    private readonly generationSettingsRepository: GenerationSettingsRepository
  ) {}

  public async execute(input: GetGenerationSettingsInput): Promise<GenerationSettingsDto> {
    let settings = await this.generationSettingsRepository.findByProfileId(input.profileId);
    if (!settings) {
      settings = GenerationSettings.createDefault(input.profileId);
      await this.generationSettingsRepository.save(settings);
    }

    return toGenerationSettingsDto(settings);
  }
}
