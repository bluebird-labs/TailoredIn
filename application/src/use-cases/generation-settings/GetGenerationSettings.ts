import {
  type ExperienceGenerationOverrideRepository,
  type ExperienceRepository,
  GenerationSettings,
  type GenerationSettingsRepository
} from '@tailoredin/domain';
import type { GenerationSettingsDto } from '../../dtos/GenerationSettingsDto.js';
import { toGenerationSettingsDto } from '../../dtos/GenerationSettingsDto.js';

export type GetGenerationSettingsInput = {
  profileId: string;
};

export class GetGenerationSettings {
  public constructor(
    private readonly generationSettingsRepository: GenerationSettingsRepository,
    private readonly experienceRepository: ExperienceRepository,
    private readonly experienceOverrideRepository: ExperienceGenerationOverrideRepository
  ) {}

  public async execute(input: GetGenerationSettingsInput): Promise<GenerationSettingsDto> {
    let settings = await this.generationSettingsRepository.findByProfileId(input.profileId);
    if (!settings) {
      settings = GenerationSettings.createDefault(input.profileId);
      await this.generationSettingsRepository.save(settings);
    }

    const allExperiences = await this.experienceRepository.findAll();
    const experienceIds = allExperiences.filter(e => e.profileId === input.profileId).map(e => e.id);
    const overrides = await this.experienceOverrideRepository.findByExperienceIds(experienceIds);

    return toGenerationSettingsDto(settings, overrides);
  }
}
