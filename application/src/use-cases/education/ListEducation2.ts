import type { EducationRepository } from '@tailoredin/domain';
import type { EducationDto } from '../../dtos/EducationDto.js';

export class ListEducation2 {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(): Promise<EducationDto[]> {
    const entries = await this.educationRepository.findAll();

    return entries.map(e => ({
      id: e.id.value,
      degreeTitle: e.degreeTitle,
      institutionName: e.institutionName,
      graduationYear: e.graduationYear,
      location: e.location,
      honors: e.honors,
      ordinal: e.ordinal
    }));
  }
}
