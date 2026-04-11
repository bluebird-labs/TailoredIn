import type { Experience, JobDescription, JobLevel, JobSource, LocationType, ResumeContent } from '@tailoredin/domain';

function parseScopedInstructions(prompt: string): Record<string, string> {
  if (!prompt) return {};
  try {
    const parsed = JSON.parse(prompt);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return prompt ? { resume: prompt } : {};
  }
}

export type SalaryRangeDto = {
  readonly min: number | null;
  readonly max: number | null;
  readonly currency: string;
};

export type ResumeOutputDto = {
  readonly headline: string;
  readonly experiences: ReadonlyArray<{
    readonly experienceId: string;
    readonly experienceTitle: string;
    readonly companyName: string;
    readonly startDate: string;
    readonly endDate: string;
    readonly summary: string;
    readonly bullets: readonly string[];
    readonly hiddenBulletIndices: readonly number[];
  }>;
  readonly hiddenEducationIds: readonly string[];
  readonly generatedAt: string;
  readonly scopedInstructions: Record<string, string>;
};

export type JobDescriptionDto = {
  readonly id: string;
  readonly companyId: string;
  readonly companyName: string | null;
  readonly companyLogoUrl: string | null;
  readonly title: string;
  readonly description: string;
  readonly url: string | null;
  readonly location: string | null;
  readonly salaryRange: SalaryRangeDto | null;
  readonly level: JobLevel;
  readonly locationType: LocationType;
  readonly source: JobSource;
  readonly postedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly rawText: string | null;
  readonly soughtHardSkills: string[] | null;
  readonly soughtSoftSkills: string[] | null;
  readonly resumeOutput: ResumeOutputDto | null;
  readonly hasCachedPdf: boolean;
  readonly resumePdfTheme: string | null;
};

export function toJobDescriptionDto(
  jd: JobDescription,
  resumeContent?: ResumeContent | null,
  experiences?: Experience[],
  company?: { name: string; logoUrl: string | null } | null
): JobDescriptionDto {
  return {
    id: jd.id,
    companyId: jd.companyId,
    companyName: company?.name ?? null,
    companyLogoUrl: company?.logoUrl ?? null,
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
    soughtHardSkills: jd.soughtHardSkills,
    soughtSoftSkills: jd.soughtSoftSkills,
    resumeOutput: resumeContent
      ? {
          headline: resumeContent.headline,
          experiences: resumeContent.experiences.map(e => {
            const exp = experiences?.find(x => x.id === e.experienceId);
            return {
              experienceId: e.experienceId,
              experienceTitle: exp?.title ?? '',
              companyName: exp?.companyName ?? '',
              startDate: exp?.startDate ?? '',
              endDate: exp?.endDate ?? '',
              summary: e.summary,
              bullets: e.bullets,
              hiddenBulletIndices: e.hiddenBulletIndices
            };
          }),
          hiddenEducationIds: resumeContent.hiddenEducationIds,
          generatedAt: resumeContent.createdAt.toISOString(),
          scopedInstructions: parseScopedInstructions(resumeContent.prompt)
        }
      : null,
    hasCachedPdf: jd.resumePdf !== null,
    resumePdfTheme: jd.resumePdfTheme
  };
}
