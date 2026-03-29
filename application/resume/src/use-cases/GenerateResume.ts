import { inject, injectable } from '@needle-di/core';
import { Resume } from '@tailoredin/domain-resume';
import { Archetype } from '@tailoredin/domain-job';
import { ok, err, type Result } from '@tailoredin/domain-shared';
import * as NpmLog from 'npmlog';
import { ApplicationResumeDI } from '../DI.js';
import type { LlmService } from '../ports/LlmService.js';
import type { ResumeContentFactory } from '../ports/ResumeContentFactory.js';
import type { ResumeRenderer } from '../ports/ResumeRenderer.js';
import type { WebColorService } from '../ports/WebColorService.js';
import type { GenerateResumeDto } from '../dtos/GenerateResumeDto.js';
import type { ResumeOutputDto } from '../dtos/ResumeOutputDto.js';
import { ApplicationJobDI } from '@tailoredin/application-job';
import type { JobRepository } from '@tailoredin/application-job';

const DEFAULT_AWESOME_COLOR = '#178FEA';

@injectable()
export class GenerateResume {
  constructor(
    private readonly jobRepository = inject(ApplicationJobDI.JobRepository) as unknown as JobRepository,
    private readonly llmService = inject(ApplicationResumeDI.LlmService),
    private readonly webColorService = inject(ApplicationResumeDI.WebColorService),
    private readonly resumeRenderer = inject(ApplicationResumeDI.ResumeRenderer),
    private readonly resumeContentFactory = inject(ApplicationResumeDI.ResumeContentFactory)
  ) {}

  async execute(input: GenerateResumeDto): Promise<Result<ResumeOutputDto, Error>> {
    let job;
    try {
      job = await this.jobRepository.findByIdOrFail(input.jobId);
    } catch {
      return err(new Error(`Job not found: ${input.jobId}`));
    }

    NpmLog.info(GenerateResume.name, 'Extracting job posting insights...');

    const postingInsights = await this.llmService.extractJobPostingInsights({
      jobDescription: job.description,
      companyName: job.companyId,
      jobTitle: job.title,
      jobLocation: job.locationRaw
    });

    const archetype = postingInsights.archetype ?? Archetype.LEAD_IC;

    // Build a preliminary resume to give context to the application insights LLM call.
    const tmpContent = this.resumeContentFactory.make({
      archetype,
      awesomeColor: DEFAULT_AWESOME_COLOR,
      keywords: []
    });

    NpmLog.info(GenerateResume.name, 'Extracting application insights...');

    const appInsights = await this.llmService.extractApplicationInsights({
      jobDescription: job.description,
      companyName: job.companyId,
      jobTitle: job.title,
      jobLocation: job.locationRaw,
      archetype,
      resumeContent: tmpContent
    });

    let awesomeColor = DEFAULT_AWESOME_COLOR;

    if (postingInsights.website) {
      NpmLog.info(GenerateResume.name, 'Extracting website colors...');
      const primaryColor = await this.webColorService.findPrimaryColor(postingInsights.website);
      if (primaryColor) awesomeColor = primaryColor;
    }

    const content = this.resumeContentFactory.make({
      archetype,
      awesomeColor,
      keywords: appInsights.keywords
    });

    NpmLog.info(GenerateResume.name, 'Rendering resume PDF...');

    const pdfPath = await this.resumeRenderer.render({
      content,
      companyName: job.companyId,
      archetype
    });

    const resume = Resume.create({
      jobId: job.id.value,
      archetype,
      keywords: appInsights.keywords,
      outputPath: pdfPath
    });

    return ok({ pdfPath, resumeId: resume.id.value });
  }
}
