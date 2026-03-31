import type { Company, JobPosting, JobRepository } from '@tailoredin/domain';
import type { CompanyDto } from '../dtos/CompanyDto.js';

export type GetJobInput = {
  jobId: string;
};

export type GetJobOutput = {
  job: JobPosting;
  company: CompanyDto;
};

export class GetJob {
  public constructor(private readonly jobRepository: JobRepository) {}

  public async execute(input: GetJobInput): Promise<GetJobOutput> {
    const result = await this.jobRepository.findByIdWithCompanyOrFail(input.jobId);

    return {
      job: result.job,
      company: toCompanyDto(result.company)
    };
  }
}

function toCompanyDto(company: Company): CompanyDto {
  return {
    id: company.id.value,
    name: company.name,
    website: company.website,
    logoUrl: company.logoUrl,
    linkedinLink: company.linkedinLink,
    businessType: company.businessType,
    industry: company.industry,
    stage: company.stage
  };
}
