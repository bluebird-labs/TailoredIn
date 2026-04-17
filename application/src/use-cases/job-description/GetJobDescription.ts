import { Inject, Injectable } from '@nestjs/common';
import type {
  CompanyRepository,
  ExperienceRepository,
  JobDescriptionRepository,
  JobFitScoreRepository,
  ResumeContentRepository
} from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { JobDescriptionDto } from '../../dtos/JobDescriptionDto.js';
import { toJobDescriptionDto } from '../../dtos/JobDescriptionDto.js';

export type GetJobDescriptionInput = {
  jobDescriptionId: string;
};

@Injectable()
export class GetJobDescription {
  public constructor(
    @Inject(DI.JobDescription.Repository) private readonly jobDescriptionRepository: JobDescriptionRepository,
    @Inject(DI.ResumeContent.Repository) private readonly resumeContentRepository: ResumeContentRepository,
    @Inject(DI.Experience.Repository) private readonly experienceRepository: ExperienceRepository,
    @Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository,
    @Inject(DI.JobDescription.FitScoreRepository) private readonly jobFitScoreRepository: JobFitScoreRepository
  ) {}

  public async execute(input: GetJobDescriptionInput): Promise<JobDescriptionDto> {
    const jd = await this.jobDescriptionRepository.findById(input.jobDescriptionId);
    if (!jd) {
      throw new Error(`JobDescription not found: ${input.jobDescriptionId}`);
    }
    const [resumeContent, fitScore] = await Promise.all([
      this.resumeContentRepository.findLatestByJobDescriptionId(jd.id),
      this.jobFitScoreRepository.findByJobDescriptionId(jd.id)
    ]);
    const experiences = resumeContent ? await this.experienceRepository.findAll() : [];
    const company = jd.companyId ? await this.companyRepository.findById(jd.companyId) : null;
    return toJobDescriptionDto(
      jd,
      resumeContent,
      experiences,
      company ? { name: company.name, logoUrl: company.logoUrl } : null,
      fitScore
    );
  }
}
