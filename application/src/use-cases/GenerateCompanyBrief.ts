import { Logger } from '@tailoredin/core';
import {
  CompanyBrief,
  type CompanyBriefRepository,
  err,
  type JobRepository,
  ok,
  type Result
} from '@tailoredin/domain';
import type { CompanyBriefDto } from '../dtos/CompanyBriefDto.js';
import type { LlmService } from '../ports/LlmService.js';

export type GenerateCompanyBriefInput = {
  jobId: string;
};

export class GenerateCompanyBrief {
  private readonly log = Logger.create(GenerateCompanyBrief.name);

  public constructor(
    private readonly jobRepository: JobRepository,
    private readonly companyBriefRepository: CompanyBriefRepository,
    private readonly llmService: LlmService | null
  ) {}

  public async execute(input: GenerateCompanyBriefInput): Promise<Result<CompanyBriefDto, Error>> {
    if (!this.llmService) {
      return err(new Error('Company briefs require an OpenAI API key'));
    }

    let job: Awaited<ReturnType<JobRepository['findScoredByIdOrFail']>>;
    try {
      job = await this.jobRepository.findScoredByIdOrFail({
        jobId: input.jobId,
        targetSalary: 0
      });
    } catch {
      return err(new Error(`Job not found: ${input.jobId}`));
    }

    const company = job.company;

    this.log.info(`Generating company brief for ${company.name}...`);

    const sections = await this.llmService.generateCompanyBrief({
      companyName: company.name,
      companyWebsite: company.website,
      jobTitle: job.job.title,
      jobDescription: job.job.description
    });

    let brief = await this.companyBriefRepository.findByCompanyId(company.id.value);

    if (brief) {
      brief.refresh(sections);
    } else {
      brief = CompanyBrief.create({
        companyId: company.id.value,
        ...sections
      });
    }

    await this.companyBriefRepository.save(brief);

    this.log.info(`Company brief generated for ${company.name}`);

    return ok(toDto(brief));
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
