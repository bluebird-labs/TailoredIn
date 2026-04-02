import { Logger } from '@tailoredin/core';
import {
  ArchetypeKey,
  type ArchetypeRepository,
  err,
  type JobPosting,
  type JobRepository,
  ok,
  type ProfileRepository,
  type Result,
  Resume,
  TailoringStrategyService
} from '@tailoredin/domain';
import type { GenerateResumeFromJobDto } from '../dtos/GenerateResumeFromJobDto.js';
import type { ResumeOutputDto } from '../dtos/ResumeOutputDto.js';
import type { LlmService } from '../ports/LlmService.js';
import type { ResumeContentFactory } from '../ports/ResumeContentFactory.js';
import type { ResumeRenderer } from '../ports/ResumeRenderer.js';
import type { WebColorService } from '../ports/WebColorService.js';

const DEFAULT_AWESOME_COLOR = '#0395DE';

export class GenerateResumeFromJob {
  private readonly log = Logger.create(GenerateResumeFromJob.name);

  public constructor(
    private readonly jobRepository: JobRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly archetypeRepository: ArchetypeRepository,
    private readonly llmService: LlmService | null,
    private readonly webColorService: WebColorService,
    private readonly resumeRenderer: ResumeRenderer,
    private readonly resumeContentFactory: ResumeContentFactory
  ) {}

  public async execute(input: GenerateResumeFromJobDto): Promise<Result<ResumeOutputDto, Error>> {
    let job: JobPosting;
    try {
      job = await this.jobRepository.findByIdOrFail(input.jobId);
    } catch {
      return err(new Error(`Job not found: ${input.jobId}`));
    }

    const profile = await this.profileRepository.findSingle();
    const allArchetypes = await this.archetypeRepository.findAll();

    if (!input.archetype) {
      return err(new Error('Archetype is required'));
    }

    const archetype: ArchetypeKey = input.archetype;
    const keywords: string[] = input.keywords ?? [];
    let awesomeColor = DEFAULT_AWESOME_COLOR;

    // Extract company brand color if possible
    if (this.llmService) {
      try {
        const postingInsights = await this.llmService.extractJobPostingInsights({
          jobDescription: job.description,
          companyName: job.companyId,
          jobTitle: job.title,
          jobLocation: job.locationRaw
        });

        if (postingInsights.website) {
          this.log.info('Extracting website colors...');
          const primaryColor = await this.webColorService.findPrimaryColor(postingInsights.website);
          if (primaryColor) awesomeColor = primaryColor;
        }
      } catch (e) {
        this.log.warn(`LLM color extraction failed, using default color: ${e}`);
      }
    }

    // Find archetype record by key
    const archetypeRecord = allArchetypes.find(a => a.key === archetype) ?? allArchetypes[0];

    const content = await this.resumeContentFactory.make({
      profileId: profile.id.value,
      archetypeId: archetypeRecord.id.value,
      awesomeColor,
      keywords
    });

    this.log.info('Rendering resume PDF...');

    const tailoringStrategy = new TailoringStrategyService();
    const templateStyle = tailoringStrategy.resolveTemplateStyle(archetype);

    const pdfPath = await this.resumeRenderer.render({
      content,
      companyName: job.companyId,
      archetype,
      templateStyle
    });

    const resume = Resume.create({
      jobId: job.id.value,
      archetype,
      keywords,
      outputPath: pdfPath
    });

    return ok({ pdfPath, resumeId: resume.id.value });
  }
}
