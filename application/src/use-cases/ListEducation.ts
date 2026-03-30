import type { ResumeEducationRepository } from '@tailoredin/domain';
import type { ResumeEducationEntryDto } from '../dtos/ResumeDataDto.js';

export type ListEducationInput = {
  userId: string;
};

export class ListEducation {
  public constructor(private readonly educationRepository: ResumeEducationRepository) {}

  public async execute(input: ListEducationInput): Promise<ResumeEducationEntryDto[]> {
    const entries = await this.educationRepository.findAllByUserId(input.userId);

    return entries.map(e => ({
      id: e.id.value,
      degreeTitle: e.degreeTitle,
      institutionName: e.institutionName,
      graduationYear: e.graduationYear,
      locationLabel: e.locationLabel,
      ordinal: e.ordinal
    }));
  }
}
