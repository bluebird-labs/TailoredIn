import { ResumeEducation, type ResumeEducationRepository } from '@tailoredin/domain';
import type { ResumeEducationEntryDto } from '../dtos/ResumeDataDto.js';

export type CreateEducationInput = {
  userId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: string;
  locationLabel: string;
  ordinal: number;
};

export class CreateEducation {
  public constructor(private readonly educationRepository: ResumeEducationRepository) {}

  public async execute(input: CreateEducationInput): Promise<ResumeEducationEntryDto> {
    const education = ResumeEducation.create({
      userId: input.userId,
      degreeTitle: input.degreeTitle,
      institutionName: input.institutionName,
      graduationYear: input.graduationYear,
      locationLabel: input.locationLabel,
      ordinal: input.ordinal
    });

    await this.educationRepository.save(education);

    return {
      id: education.id.value,
      degreeTitle: education.degreeTitle,
      institutionName: education.institutionName,
      graduationYear: education.graduationYear,
      locationLabel: education.locationLabel,
      ordinal: education.ordinal
    };
  }
}
