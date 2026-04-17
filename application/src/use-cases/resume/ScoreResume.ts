import { Inject, Injectable } from '@nestjs/common';
import {
  EntityNotFoundError,
  type JobDescriptionRepository,
  type ResumeContent,
  type ResumeContentRepository,
  type ResumeScore
} from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { ResumeScoreDto } from '../../dtos/ResumeScoreDto.js';
import type { ResumeScorer } from '../../ports/ResumeScorer.js';

export type ScoreResumeInput = {
  resumeContentId: string;
};

export class ResumeNotReadyError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ResumeNotReadyError';
  }
}

function formatResumeAsMarkdown(resumeContent: ResumeContent): string {
  const parts: string[] = [];

  if (resumeContent.headline) {
    parts.push(`# ${resumeContent.headline}`);
  }

  for (const exp of resumeContent.experiences) {
    parts.push(`\n## ${exp.experienceId}`);
    if (exp.summary) parts.push(exp.summary);

    const hiddenSet = new Set(exp.hiddenBulletIndices);
    const visibleBullets = exp.bullets.filter((_, i) => !hiddenSet.has(i));
    for (const bullet of visibleBullets) {
      parts.push(`- ${bullet}`);
    }
  }

  return parts.join('\n');
}

function toResumeScoreDto(score: ResumeScore): ResumeScoreDto {
  return {
    overall: score.overall,
    requirements: score.requirements,
    summary: score.summary
  };
}

@Injectable()
export class ScoreResume {
  public constructor(
    @Inject(DI.ResumeContent.Repository) private readonly resumeContentRepository: ResumeContentRepository,
    @Inject(DI.JobDescription.Repository) private readonly jobDescriptionRepository: JobDescriptionRepository,
    @Inject(DI.Resume.Scorer) private readonly resumeScorer: ResumeScorer
  ) {}

  public async execute(input: ScoreResumeInput): Promise<ResumeScoreDto> {
    const resumeContent = await this.resumeContentRepository.findById(input.resumeContentId);
    if (!resumeContent) {
      throw new EntityNotFoundError('ResumeContent', input.resumeContentId);
    }

    const hasBullets = resumeContent.experiences.some(e => e.bullets.length > 0);
    if (!hasBullets) {
      throw new ResumeNotReadyError('Resume has no generated bullets to score');
    }

    const jobDescription = await this.jobDescriptionRepository.findById(resumeContent.jobDescriptionId);
    if (!jobDescription) {
      throw new EntityNotFoundError('JobDescription', resumeContent.jobDescriptionId);
    }

    const resumeMarkdown = formatResumeAsMarkdown(resumeContent);

    const score = await this.resumeScorer.score({
      jobDescriptionText: jobDescription.description,
      resumeMarkdown
    });

    const updated = resumeContent.withScore(score);
    await this.resumeContentRepository.update(updated);

    return toResumeScoreDto(score);
  }
}
