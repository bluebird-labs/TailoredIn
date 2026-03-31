import {
  type CompanyBrief,
  type CompanyBriefRepository,
  err,
  type JobPosting,
  type JobRepository,
  ok,
  type Result
} from '@tailoredin/domain';
import type { CompanyBriefDto } from '../dtos/CompanyBriefDto.js';

export type GetCompanyBriefInput = {
  jobId: string;
};

export class GetCompanyBrief {
  public constructor(
    private readonly jobRepository: JobRepository,
    private readonly companyBriefRepository: CompanyBriefRepository
  ) {}

  public async execute(input: GetCompanyBriefInput): Promise<Result<CompanyBriefDto | null, Error>> {
    let job: JobPosting;
    try {
      job = await this.jobRepository.findByIdOrFail(input.jobId);
    } catch {
      return err(new Error(`Job not found: ${input.jobId}`));
    }

    const brief = await this.companyBriefRepository.findByCompanyId(job.companyId);

    return ok(brief ? toDto(brief) : null);
  }
}

function toDto(brief: CompanyBrief): CompanyBriefDto {
  return {
    id: brief.id.value,
    companyId: brief.companyId,
    productOverview: brief.productOverview,
    techStack: brief.techStack,
    culture: brief.culture,
    recentNews: brief.recentNews,
    keyPeople: brief.keyPeople,
    createdAt: brief.createdAt.toISOString(),
    updatedAt: brief.updatedAt.toISOString()
  };
}
