import {
  type Education,
  type EducationRepository,
  EntityNotFoundError,
  err,
  ok,
  type Result
} from '@tailoredin/domain';
import type { EducationDto } from '../../dtos/EducationDto.js';

export type UpdateEducationInput = {
  educationId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
  hiddenByDefault: boolean;
};

export class UpdateEducation {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(input: UpdateEducationInput): Promise<Result<EducationDto, Error>> {
    let education: Education;
    try {
      education = await this.educationRepository.findByIdOrFail(input.educationId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    education.degreeTitle = input.degreeTitle;
    education.institutionName = input.institutionName;
    education.graduationYear = input.graduationYear;
    education.location = input.location;
    education.honors = input.honors;
    education.ordinal = input.ordinal;
    education.hiddenByDefault = input.hiddenByDefault;
    education.updatedAt = new Date();

    await this.educationRepository.save(education);

    return ok({
      id: education.id.value,
      degreeTitle: education.degreeTitle,
      institutionName: education.institutionName,
      graduationYear: education.graduationYear,
      location: education.location,
      honors: education.honors,
      ordinal: education.ordinal,
      hiddenByDefault: education.hiddenByDefault
    });
  }
}
