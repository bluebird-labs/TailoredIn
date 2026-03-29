import { Archetype, err, type JobPosting, ok, type Result, Resume } from '@tailoredin/domain';
import * as NpmLog from 'npmlog';
import type { GenerateResumeDto } from '../dtos/GenerateResumeDto.js';
import type { ResumeOutputDto } from '../dtos/ResumeOutputDto.js';
import type { JobRepository } from '../ports/JobRepository.js';
import type { LlmService } from '../ports/LlmService.js';
import type { ResumeContentFactory } from '../ports/ResumeContentFactory.js';
import type { ResumeRenderer } from '../ports/ResumeRenderer.js';
import type { WebColorService } from '../ports/WebColorService.js';

const DEFAULT_AWESOME_COLOR = '#178FEA';

export class GenerateResume {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly llmService: LlmService,
    private readonly webColorService: WebColorService,
    private readonly resumeRenderer: ResumeRenderer,
    private readonly resumeContentFactory: ResumeContentFactory
  ) {}

  async execute(input: GenerateResumeDto): Promise<Result<ResumeOutputDto, Error>> {
    let job: JobPosting;
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
