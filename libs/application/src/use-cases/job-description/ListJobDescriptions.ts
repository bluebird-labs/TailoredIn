import { Inject, Injectable } from '@nestjs/common';
import type { CompanyRepository, JobDescriptionRepository, JobFitScoreRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';
import type { JobDescriptionDto } from '../../dtos/JobDescriptionDto.js';
import { toJobDescriptionDto } from '../../dtos/JobDescriptionDto.js';

export type ListJobDescriptionsInput = {
  companyId?: string;
};

@Injectable()
export class ListJobDescriptions {
  public constructor(
    @Inject(DI.JobDescription.Repository) private readonly jobDescriptionRepository: JobDescriptionRepository,
    @Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository,
    @Inject(DI.JobDescription.FitScoreRepository) private readonly jobFitScoreRepository: JobFitScoreRepository
  ) {}

  public async execute(input: ListJobDescriptionsInput): Promise<JobDescriptionDto[]> {
    const jobDescriptions = input.companyId
      ? await this.jobDescriptionRepository.findByCompanyId(input.companyId)
      : await this.jobDescriptionRepository.findAll();

    const jdIds = jobDescriptions.map(jd => jd.id);
    const companyIds = [...new Set(jobDescriptions.map(jd => jd.companyId))];

    const [companies, fitScores] = await Promise.all([
      Promise.all(companyIds.map(id => this.companyRepository.findById(id))),
      this.jobFitScoreRepository.findByJobDescriptionIds(jdIds)
    ]);

    const companyMap = new Map(companies.filter(Boolean).map(c => [c!.id, toCompanyDto(c!)]));
    const fitScoreMap = new Map(fitScores.map(s => [s.jobDescriptionId, s]));

    return jobDescriptions.map(jd => {
      const company = companyMap.get(jd.companyId);
      return toJobDescriptionDto(
        jd,
        null,
        undefined,
        company ? { name: company.name, logoUrl: company.logoUrl } : null,
        fitScoreMap.get(jd.id) ?? null
      );
    });
  }
}
