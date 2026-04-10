import {
  EntityNotFoundError,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result
} from '@tailoredin/domain';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type AccomplishmentInput = {
  id: string | null;
  title: string;
  narrative: string;
  ordinal: number;
};

export type UpdateExperienceInput = {
  experienceId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyAccent: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  accomplishments: AccomplishmentInput[];
  bulletMin?: number;
  bulletMax?: number;
};

export class UpdateExperience {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateExperienceInput): Promise<Result<ExperienceDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    experience.title = input.title;
    experience.companyName = input.companyName;
    experience.companyWebsite = input.companyWebsite;
    experience.companyAccent = input.companyAccent;
    experience.location = input.location;
    experience.startDate = input.startDate;
    experience.endDate = input.endDate;
    experience.summary = input.summary;
    experience.ordinal = input.ordinal;
    experience.updatedAt = new Date();
    experience.syncAccomplishments(input.accomplishments);

    if (input.bulletMin !== undefined && input.bulletMax !== undefined) {
      experience.updateBulletRange(input.bulletMin, input.bulletMax);
    }

    await this.experienceRepository.save(experience);
    return ok(toExperienceDto(experience));
  }
}
