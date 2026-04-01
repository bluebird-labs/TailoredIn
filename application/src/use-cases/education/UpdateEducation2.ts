import { type EducationRepository, type Result, err, ok } from '@tailoredin/domain';
import type { EducationDto } from '../../dtos/EducationDto.js';

export type UpdateEducation2Input = {
  educationId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};

export class UpdateEducation2 {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(input: UpdateEducation2Input): Promise<Result<EducationDto, Error>> {
    let education;
    try {
      education = await this.educationRepository.findByIdOrFail(input.educationId);
    } catch {
      return err(new Error(`Education entry not found: ${input.educationId}`));
    }

    education.degreeTitle = input.degreeTitle;
    education.institutionName = input.institutionName;
    education.graduationYear = input.graduationYear;
    education.location = input.location;
    education.honors = input.honors;
    education.ordinal = input.ordinal;
    education.updatedAt = new Date();

    await this.educationRepository.save(education);

    return ok({
      id: education.id.value,
      degreeTitle: education.degreeTitle,
      institutionName: education.institutionName,
      graduationYear: education.graduationYear,
      location: education.location,
      honors: education.honors,
      ordinal: education.ordinal
    });
  }
}
