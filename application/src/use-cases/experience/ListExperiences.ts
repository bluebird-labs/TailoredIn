import type { Accomplishment, Experience, ExperienceRepository } from '@tailoredin/domain';
import type { AccomplishmentDto, ExperienceDto } from '../../dtos/ExperienceDto.js';

export class ListExperiences {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(): Promise<ExperienceDto[]> {
    const experiences = await this.experienceRepository.findAll();
    return experiences.map(toExperienceDto);
  }
}

export function toExperienceDto(exp: Experience): ExperienceDto {
  return {
    id: exp.id.value,
    title: exp.title,
    companyName: exp.companyName,
    companyWebsite: exp.companyWebsite,
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    summary: exp.summary,
    ordinal: exp.ordinal,
    accomplishments: exp.accomplishments.map(toAccomplishmentDto)
  };
}

function toAccomplishmentDto(accomplishment: Accomplishment): AccomplishmentDto {
  return {
    id: accomplishment.id.value,
    title: accomplishment.title,
    narrative: accomplishment.narrative,
    ordinal: accomplishment.ordinal
  };
}
