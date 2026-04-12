import {
  type Company,
  type CompanyRepository,
  EntityNotFoundError,
  type Experience,
  type ExperienceRepository,
  type JobDescriptionRepository,
  JobFitScore,
  type JobFitScoreRepository,
  type ProfileRepository
} from '@tailoredin/domain';
import type { JobFitScoreDto } from '../../dtos/JobFitScoreDto.js';
import type { FitScorer } from '../../ports/FitScorer.js';

export type ScoreJobFitInput = {
  jobDescriptionId: string;
};

function formatProfileAsMarkdown(
  profile: { about: string | null; fullName: string },
  experiences: Experience[],
  companyMap: Map<string, Company>
): string {
  const parts: string[] = [];

  parts.push(`# ${profile.fullName}`);

  if (profile.about) {
    parts.push(`\n## About\n\n${profile.about}`);
  }

  for (const exp of experiences) {
    parts.push(`\n## ${exp.title} at ${exp.companyName}`);
    parts.push(`${exp.startDate} – ${exp.endDate} | ${exp.location}`);

    if (exp.companyId) {
      const company = companyMap.get(exp.companyId);
      if (company) {
        const details: string[] = [];
        if (company.description) details.push(company.description);
        if (company.industry !== 'unknown') details.push(`Industry: ${company.industry}`);
        if (company.stage !== 'unknown') details.push(`Stage: ${company.stage}`);
        if (company.businessType !== 'unknown') details.push(`Business type: ${company.businessType}`);
        if (details.length > 0) {
          parts.push(`\nCompany context: ${details.join(' | ')}`);
        }
      }
    }

    if (exp.summary) {
      parts.push(`\n${exp.summary}`);
    }

    for (const acc of exp.accomplishments) {
      parts.push(`\n### ${acc.title}\n${acc.narrative}`);
    }
  }

  return parts.join('\n');
}

function toJobFitScoreDto(score: JobFitScore): JobFitScoreDto {
  return {
    id: score.id,
    overall: score.overall,
    requirements: score.requirements.map(r => ({
      requirement: r.requirement,
      coverage: r.coverage,
      reasoning: r.reasoning
    })),
    summary: score.summary,
    createdAt: score.createdAt.toISOString()
  };
}

export class ScoreJobFit {
  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly experienceRepository: ExperienceRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly jobDescriptionRepository: JobDescriptionRepository,
    private readonly jobFitScoreRepository: JobFitScoreRepository,
    private readonly fitScorer: FitScorer
  ) {}

  public async execute(input: ScoreJobFitInput): Promise<JobFitScoreDto> {
    const jd = await this.jobDescriptionRepository.findById(input.jobDescriptionId);
    if (!jd) {
      throw new EntityNotFoundError('JobDescription', input.jobDescriptionId);
    }

    const profile = await this.profileRepository.findSingle();
    const experiences = await this.experienceRepository.findAll();

    const companyIds = [...new Set(experiences.map(e => e.companyId).filter(Boolean))] as string[];
    const companies = await Promise.all(companyIds.map(id => this.companyRepository.findById(id)));
    const companyMap = new Map<string, Company>();
    for (const company of companies) {
      if (company) companyMap.set(company.id, company);
    }

    const profileMarkdown = formatProfileAsMarkdown(profile, experiences, companyMap);

    const result = await this.fitScorer.score({
      jobDescriptionText: jd.description,
      profileMarkdown
    });

    const fitScore = JobFitScore.create({
      profileId: profile.id,
      jobDescriptionId: jd.id,
      overall: result.overall,
      summary: result.summary,
      requirements: result.requirements
    });

    await this.jobFitScoreRepository.save(fitScore);

    return toJobFitScoreDto(fitScore);
  }
}
