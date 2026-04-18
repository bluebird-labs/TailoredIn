import { Inject, Injectable } from '@nestjs/common';
import type { EducationRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { EducationDto } from '../../dtos/EducationDto.js';

@Injectable()
export class ListEducation {
  public constructor(@Inject(DI.Education.Repository) private readonly educationRepository: EducationRepository) {}

  public async execute(): Promise<EducationDto[]> {
    const entries = await this.educationRepository.findAll();

    return entries.map(e => ({
      id: e.id,
      degreeTitle: e.degreeTitle,
      institutionName: e.institutionName,
      graduationYear: e.graduationYear,
      location: e.location,
      honors: e.honors,
      ordinal: e.ordinal,
      hiddenByDefault: e.hiddenByDefault
    }));
  }
}
