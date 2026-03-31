import type { BusinessType, CompanyStage, Industry, JobListItem, JobRepository, JobStatus } from '@tailoredin/domain';
import type { JobListItemDto } from '../dtos/JobListItemDto.js';
import type { PaginatedDto } from '../dtos/PaginationDto.js';

export type ListJobsInput = {
  limit: number;
  offset: number;
  statuses?: JobStatus[];
  businessTypes?: BusinessType[];
  industries?: Industry[];
  stages?: CompanyStage[];
  sort: string;
};

export class ListJobs {
  public constructor(private readonly jobRepository: JobRepository) {}

  public async execute(input: ListJobsInput): Promise<PaginatedDto<JobListItemDto>> {
    const result = await this.jobRepository.findPaginated({
      limit: input.limit,
      offset: input.offset,
      statuses: input.statuses,
      businessTypes: input.businessTypes,
      industries: input.industries,
      stages: input.stages,
      sort: input.sort
    });

    return {
      items: result.items.map(toJobListItemDto),
      pagination: {
        limit: input.limit,
        offset: input.offset,
        total: result.total,
        hasNext: input.offset + input.limit < result.total
      }
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
    salaryRaw: job.salaryRaw
  };
}
