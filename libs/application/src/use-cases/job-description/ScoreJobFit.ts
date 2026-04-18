import { Inject, Injectable } from '@nestjs/common';
import {
  type Company,
  type CompanyRepository,
  EntityNotFoundError,
  type Experience,
  type ExperienceRepository,
  type JobDescriptionRepository,
  JobFitScore,
  type JobFitScoreRepository,
  type ProfileRepository,
  type Skill,
  SkillKind,
  type SkillRepository
} from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { JobFitScoreDto } from '../../dtos/JobFitScoreDto.js';
import type { FitScorer } from '../../ports/FitScorer.js';

export type ScoreJobFitInput = {
  profileId: string;
  jobDescriptionId: string;
};

const SKILL_KIND_HEADINGS: { kind: SkillKind; heading: string }[] = [
  { kind: SkillKind.PROGRAMMING_LANGUAGE, heading: 'Programming Languages' },
  { kind: SkillKind.MARKUP_LANGUAGE, heading: 'Markup Languages' },
  { kind: SkillKind.QUERY_LANGUAGE, heading: 'Query Languages' },
  { kind: SkillKind.FRAMEWORK, heading: 'Frameworks' },
  { kind: SkillKind.LIBRARY, heading: 'Libraries' },
  { kind: SkillKind.DATABASE, heading: 'Databases' },
  { kind: SkillKind.TOOL, heading: 'Tools' },
  { kind: SkillKind.SERVICE, heading: 'Services' },
  { kind: SkillKind.PROTOCOL, heading: 'Protocols' }
];

function formatSkillsAsMarkdown(skills: Skill[]): string | null {
  if (skills.length === 0) return null;

  const byKind = new Map<SkillKind, string[]>();
  for (const skill of skills) {
    const list = byKind.get(skill.kind) ?? [];
    list.push(skill.label);
    byKind.set(skill.kind, list);
  }

  const blocks: string[] = ['\n## Skills'];
  for (const { kind, heading } of SKILL_KIND_HEADINGS) {
    const labels = byKind.get(kind);
    if (!labels || labels.length === 0) continue;
    labels.sort((a, b) => a.localeCompare(b));
    blocks.push(`\n### ${heading}\n${labels.join(', ')}`);
  }

  return blocks.join('\n');
}

function formatProfileAsMarkdown(
  profile: { about: string | null; fullName: string },
  experiences: Experience[],
  companyMap: Map<string, Company>,
  skills: Skill[]
): string {
  const parts: string[] = [];

  parts.push(`# ${profile.fullName}`);

  if (profile.about) {
    parts.push(`\n## About\n\n${profile.about}`);
  }

  const skillsBlock = formatSkillsAsMarkdown(skills);
  if (skillsBlock) {
    parts.push(skillsBlock);
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

@Injectable()
export class ScoreJobFit {
  public constructor(
    @Inject(DI.Profile.Repository) private readonly profileRepository: ProfileRepository,
    @Inject(DI.Experience.Repository) private readonly experienceRepository: ExperienceRepository,
    @Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository,
    @Inject(DI.JobDescription.Repository) private readonly jobDescriptionRepository: JobDescriptionRepository,
    @Inject(DI.JobDescription.FitScoreRepository) private readonly jobFitScoreRepository: JobFitScoreRepository,
    @Inject(DI.JobDescription.FitScorer) private readonly fitScorer: FitScorer,
    @Inject(DI.Skill.Repository) private readonly skillRepository: SkillRepository
  ) {}

  public async execute(input: ScoreJobFitInput): Promise<JobFitScoreDto> {
    const jd = await this.jobDescriptionRepository.findById(input.jobDescriptionId);
    if (!jd) {
      throw new EntityNotFoundError('JobDescription', input.jobDescriptionId);
    }

    const profile = await this.profileRepository.findByIdOrFail(input.profileId);
    const experiences = await this.experienceRepository.findAll();

    const companyIds = [...new Set(experiences.map(e => e.companyId).filter(Boolean))] as string[];
    const companies = await Promise.all(companyIds.map(id => this.companyRepository.findById(id)));
    const companyMap = new Map<string, Company>();
    for (const company of companies) {
      if (company) companyMap.set(company.id, company);
    }

    const skillIds = [...new Set(experiences.flatMap(e => e.skills.getItems().map(es => es.skillId)))];
    const skills = skillIds.length > 0 ? await this.skillRepository.findByIds(skillIds) : [];

    const profileMarkdown = formatProfileAsMarkdown(profile, experiences, companyMap, skills);

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
