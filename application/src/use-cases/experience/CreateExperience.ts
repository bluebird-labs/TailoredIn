import {
  Experience,
  type ExperienceRepository,
  GenerationSettings,
  type GenerationSettingsRepository
} from '@tailoredin/domain';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type CreateExperienceInput = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyAccent: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

export class CreateExperience {
  public constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly generationSettingsRepository: GenerationSettingsRepository
  ) {}

  public async execute(input: CreateExperienceInput): Promise<ExperienceDto> {
    const settings = await this.generationSettingsRepository.findByProfileId(input.profileId);
    const defaults = settings ?? GenerationSettings.createDefault(input.profileId);

    const experience = Experience.create({
      ...input,
      companyId: null,
      bulletMin: defaults.bulletMin,
      bulletMax: defaults.bulletMax
    });
    await this.experienceRepository.save(experience);
    return toExperienceDto(experience);
  }
}
