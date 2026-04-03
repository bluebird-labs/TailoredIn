import { Logger } from '@tailoredin/core';
import {
  type ArchetypeKey,
  type ArchetypeRepository,
  err,
  type JobPosting,
  type JobRepository,
  ok,
  type ProfileRepository,
  type Result,
  Resume
} from '@tailoredin/domain';
import type { GenerateResumeFromJobDto } from '../dtos/GenerateResumeFromJobDto.js';
import type { ResumeOutputDto } from '../dtos/ResumeOutputDto.js';
import type { ResumeContentFactory } from '../ports/ResumeContentFactory.js';
import type { ResumeRenderer } from '../ports/ResumeRenderer.js';

export class GenerateResumeFromJob {
  private readonly log = Logger.create(GenerateResumeFromJob.name);

  public constructor(
    private readonly jobRepository: JobRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly archetypeRepository: ArchetypeRepository,
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

    // Find archetype record by key
    const archetypeRecord = allArchetypes.find(a => a.key === archetype) ?? allArchetypes[0];

    const content = await this.resumeContentFactory.make({
      profileId: profile.id.value,
      archetypeId: archetypeRecord.id.value,
      keywords
    });

    this.log.info('Rendering resume PDF...');

    const pdfPath = await this.resumeRenderer.render({
      content,
      companyName: job.companyId,
      templateKey: input.templateKey
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
