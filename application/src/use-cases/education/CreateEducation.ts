import { Education, type EducationRepository } from '@tailoredin/domain';
import type { EducationDto } from '../../dtos/EducationDto.js';

export type CreateEducationInput = {
  profileId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
  hiddenByDefault?: boolean;
};

export class CreateEducation {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(input: CreateEducationInput): Promise<EducationDto> {
    const education = Education.create({
      profileId: input.profileId,
      degreeTitle: input.degreeTitle,
      institutionName: input.institutionName,
      graduationYear: input.graduationYear,
      location: input.location,
      honors: input.honors,
      ordinal: input.ordinal,
      hiddenByDefault: input.hiddenByDefault
    });

    await this.educationRepository.save(education);

    return {
      id: education.id.value,
      degreeTitle: education.degreeTitle,
      institutionName: education.institutionName,
      graduationYear: education.graduationYear,
      location: education.location,
      honors: education.honors,
      ordinal: education.ordinal,
      hiddenByDefault: education.hiddenByDefault
    };
  }
}
