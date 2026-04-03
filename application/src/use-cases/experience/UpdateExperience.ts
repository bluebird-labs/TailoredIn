import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type UpdateExperienceInput = {
  experienceId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  narrative?: string | null;
  ordinal: number;
};

export class UpdateExperience {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateExperienceInput): Promise<Result<ExperienceDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    experience.title = input.title;
    experience.companyName = input.companyName;
    experience.companyWebsite = input.companyWebsite;
    experience.location = input.location;
    experience.startDate = input.startDate;
    experience.endDate = input.endDate;
    experience.summary = input.summary;
    if (input.narrative !== undefined) experience.narrative = input.narrative;
    experience.ordinal = input.ordinal;
    experience.updatedAt = new Date();

    await this.experienceRepository.save(experience);
    return ok(toExperienceDto(experience));
  }
}
