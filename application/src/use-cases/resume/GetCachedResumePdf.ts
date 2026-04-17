import { Inject, Injectable } from '@nestjs/common';
import type { JobDescriptionRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';

export type GetCachedResumePdfInput = {
  jobDescriptionId: string;
};

export type CachedResumePdfResult = {
  pdf: Uint8Array;
  theme: string;
};

@Injectable()
export class GetCachedResumePdf {
  public constructor(
    @Inject(DI.JobDescription.Repository) private readonly jobDescriptionRepository: JobDescriptionRepository
  ) {}

  public async execute(input: GetCachedResumePdfInput): Promise<CachedResumePdfResult | null> {
    const jd = await this.jobDescriptionRepository.findById(input.jobDescriptionId);
    if (!jd?.resumePdf) return null;
    return { pdf: jd.resumePdf, theme: jd.resumePdfTheme ?? 'brilliant-cv' };
  }
}
