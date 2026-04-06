import type { JobDescription, JobLevel, JobSource, LocationType, ResumeContent } from '@tailoredin/domain';

export type SalaryRangeDto = {
  readonly min: number | null;
  readonly max: number | null;
  readonly currency: string;
};

export type ResumeOutputDto = {
  readonly headline: string;
  readonly experiences: ReadonlyArray<{
    readonly experienceId: string;
    readonly summary: string;
    readonly bullets: readonly string[];
  }>;
  readonly generatedAt: string;
};

export type JobDescriptionDto = {
  readonly id: string;
  readonly companyId: string;
  readonly title: string;
  readonly description: string;
  readonly url: string | null;
  readonly location: string | null;
  readonly salaryRange: SalaryRangeDto | null;
  readonly level: JobLevel | null;
  readonly locationType: LocationType | null;
  readonly source: JobSource;
  readonly postedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly rawText: string | null;
  readonly resumeOutput: ResumeOutputDto | null;
};

export function toJobDescriptionDto(jd: JobDescription, resumeContent?: ResumeContent | null): JobDescriptionDto {
  return {
    id: jd.id.value,
    companyId: jd.companyId,
    title: jd.title,
    description: jd.description,
    url: jd.url,
    location: jd.location,
    salaryRange: jd.salaryRange
      ? { min: jd.salaryRange.min, max: jd.salaryRange.max, currency: jd.salaryRange.currency }
      : null,
    level: jd.level,
    locationType: jd.locationType,
    source: jd.source,
    postedAt: jd.postedAt?.toISOString() ?? null,
    createdAt: jd.createdAt.toISOString(),
    updatedAt: jd.updatedAt.toISOString(),
    rawText: jd.rawText,
    resumeOutput: resumeContent
      ? {
          headline: resumeContent.headline,
          experiences: resumeContent.experiences.map(e => ({
            experienceId: e.experienceId,
            summary: e.summary,
            bullets: e.bullets
          })),
          generatedAt: resumeContent.createdAt.toISOString()
        }
      : null
  };
}
