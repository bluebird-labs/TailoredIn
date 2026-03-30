import { err, ok, type Result, type ResumeEducation, type ResumeEducationRepository } from '@tailoredin/domain';
import type { ResumeEducationEntryDto } from '../dtos/ResumeDataDto.js';

export type UpdateEducationInput = {
  educationId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: string;
  locationLabel: string;
  ordinal: number;
};

export class UpdateEducation {
  public constructor(private readonly educationRepository: ResumeEducationRepository) {}

  public async execute(input: UpdateEducationInput): Promise<Result<ResumeEducationEntryDto, Error>> {
    let education: ResumeEducation;
    try {
      education = await this.educationRepository.findByIdOrFail(input.educationId);
    } catch {
      return err(new Error(`Education entry not found: ${input.educationId}`));
    }

    education.degreeTitle = input.degreeTitle;
    education.institutionName = input.institutionName;
    education.graduationYear = input.graduationYear;
    education.locationLabel = input.locationLabel;
    education.ordinal = input.ordinal;
    education.updatedAt = new Date();

    await this.educationRepository.save(education);

    return ok({
      id: education.id.value,
      degreeTitle: education.degreeTitle,
      institutionName: education.institutionName,
      graduationYear: education.graduationYear,
      locationLabel: education.locationLabel,
      ordinal: education.ordinal
    });
  }
}
