import {
  type JobDescriptionRepository,
  type JobLevel,
  type JobSource,
  type LocationType,
  SalaryRange
} from '@tailoredin/domain';
import type { JobDescriptionDto } from '../../dtos/JobDescriptionDto.js';
import { toJobDescriptionDto } from '../../dtos/JobDescriptionDto.js';

export type UpdateJobDescriptionInput = {
  jobDescriptionId: string;
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
};

export class UpdateJobDescription {
  public constructor(private readonly jobDescriptionRepository: JobDescriptionRepository) {}

  public async execute(input: UpdateJobDescriptionInput): Promise<JobDescriptionDto> {
    const jd = await this.jobDescriptionRepository.findById(input.jobDescriptionId);
    if (!jd) {
      throw new Error(`JobDescription not found: ${input.jobDescriptionId}`);
    }

    jd.title = input.title;
    jd.description = input.description;
    jd.url = input.url ?? null;
    jd.location = input.location ?? null;
    if (input.level !== undefined) jd.level = input.level;
    if (input.locationType !== undefined) jd.locationType = input.locationType;
    jd.source = input.source;
    jd.postedAt = input.postedAt ?? null;
    if (input.rawText !== undefined) jd.rawText = input.rawText;
    jd.salaryRange =
      input.salaryCurrency != null
        ? new SalaryRange({
            min: input.salaryMin ?? null,
            max: input.salaryMax ?? null,
            currency: input.salaryCurrency
          })
        : null;
    jd.updatedAt = new Date();

    await this.jobDescriptionRepository.save(jd);
    return toJobDescriptionDto(jd);
  }
}
