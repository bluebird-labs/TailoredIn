import { Experience, type ExperienceRepository } from '@tailoredin/domain';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type CreateExperienceInput = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

export class CreateExperience {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: CreateExperienceInput): Promise<ExperienceDto> {
    const experience = Experience.create({ ...input, companyId: null });
    await this.experienceRepository.save(experience);
    return toExperienceDto(experience);
  }
}
