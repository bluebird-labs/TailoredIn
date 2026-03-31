import type { BusinessType, CompanyStage, Industry, JobListItem, JobRepository, JobStatus } from '@tailoredin/domain';
import type { JobListItemDto, PaginatedJobListDto } from '../dtos/JobListItemDto.js';

export type ListJobsInput = {
  page: number;
  pageSize: number;
  targetSalary: number;
  statuses?: JobStatus[];
  businessTypes?: BusinessType[];
  industries?: Industry[];
  stages?: CompanyStage[];
  sortBy?: 'score' | 'posted_at';
  sortDir?: 'asc' | 'desc';
};

export class ListJobs {
  public constructor(private readonly jobRepository: JobRepository) {}

  public async execute(input: ListJobsInput): Promise<PaginatedJobListDto> {
    const result = await this.jobRepository.findPaginated({
      page: input.page,
      pageSize: input.pageSize,
      targetSalary: input.targetSalary,
      statuses: input.statuses,
      businessTypes: input.businessTypes,
      industries: input.industries,
      stages: input.stages,
      sortBy: input.sortBy,
      sortDir: input.sortDir
    });

    return {
      items: result.items.map(toJobListItemDto),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    };
  }
}

function toJobListItemDto(item: JobListItem): JobListItemDto {
  const { job } = item;
  return {
    id: job.id.value,
    title: job.title,
    companyId: item.companyId,
    companyName: item.companyName,
    status: job.status,
    postedAt: job.postedAt?.toISOString() ?? null,
    locationRaw: job.locationRaw,
    salaryRaw: job.salaryRaw,
    expertScore: job.scores?.skills.expert?.score ?? 0,
    totalSkillScore: job.scores?.skills.total?.score ?? 0,
    salaryScore: job.scores?.salary ?? null
  };
}
