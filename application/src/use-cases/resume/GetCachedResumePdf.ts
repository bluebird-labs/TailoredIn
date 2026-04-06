import { JobDescriptionId, type JobDescriptionRepository } from '@tailoredin/domain';

export type GetCachedResumePdfInput = {
  jobDescriptionId: string;
};

export type CachedResumePdfResult = {
  pdf: Uint8Array;
  theme: string;
};

export class GetCachedResumePdf {
  public constructor(private readonly jobDescriptionRepository: JobDescriptionRepository) {}

  public async execute(input: GetCachedResumePdfInput): Promise<CachedResumePdfResult | null> {
    const jd = await this.jobDescriptionRepository.findById(new JobDescriptionId(input.jobDescriptionId));
    if (!jd?.resumePdf) return null;
    return { pdf: jd.resumePdf, theme: jd.resumePdfTheme ?? 'brilliant-cv' };
  }
}
