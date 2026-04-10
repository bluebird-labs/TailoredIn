import {
  JobDescription,
  type JobDescriptionRepository,
  type JobLevel,
  type JobSource,
  type LocationType,
  SalaryRange
} from '@tailoredin/domain';
import type { JobDescriptionDto } from '../../dtos/JobDescriptionDto.js';
import { toJobDescriptionDto } from '../../dtos/JobDescriptionDto.js';

export type CreateJobDescriptionInput = {
  companyId: string;
  title: string;
  description: string;
  url?: string | null;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  level?: JobLevel;
  locationType?: LocationType;
  source: JobSource;
  postedAt?: Date | null;
  rawText?: string | null;
  soughtHardSkills?: string[] | null;
  soughtSoftSkills?: string[] | null;
};

export class CreateJobDescription {
  public constructor(private readonly jobDescriptionRepository: JobDescriptionRepository) {}

  public async execute(input: CreateJobDescriptionInput): Promise<JobDescriptionDto> {
    const salaryRange =
      input.salaryCurrency != null
        ? new SalaryRange({
            min: input.salaryMin ?? null,
            max: input.salaryMax ?? null,
            currency: input.salaryCurrency
          })
        : null;

    const jobDescription = JobDescription.create({
      companyId: input.companyId,
      title: input.title,
      description: input.description,
      url: input.url,
      location: input.location,
      salaryRange,
      level: input.level,
      locationType: input.locationType,
      source: input.source,
      postedAt: input.postedAt,
      rawText: input.rawText,
      soughtHardSkills: input.soughtHardSkills,
      soughtSoftSkills: input.soughtSoftSkills
    });
    await this.jobDescriptionRepository.save(jobDescription);
    return toJobDescriptionDto(jobDescription);
  }
}
