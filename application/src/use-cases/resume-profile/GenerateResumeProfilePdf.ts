import type { ResumeProfileRepository } from '../../ports/ResumeProfileRepository.js';
import type { ResumeContentFactory } from '../../ports/ResumeContentFactory.js';
import type { ResumeRenderer } from '../../ports/ResumeRenderer.js';

export type GenerateResumeProfilePdfInput = {
  profileId: string;
};

export type GenerateResumeProfilePdfOutput = {
  pdfPath: string;
};

export class GenerateResumeProfilePdf {
  public constructor(
    private readonly resumeProfileRepository: ResumeProfileRepository,
    private readonly resumeContentFactory: ResumeContentFactory,
    private readonly resumeRenderer: ResumeRenderer
  ) {}

  public async execute(input: GenerateResumeProfilePdfInput): Promise<GenerateResumeProfilePdfOutput> {
    const profile = await this.resumeProfileRepository.findByProfileId(input.profileId);

    if (!profile) {
      throw new Error(`ResumeProfile not found: ${input.profileId}`);
    }

    const content = await this.resumeContentFactory.makeFromSelection({
      profileId: profile.profileId,
      headlineText: profile.headlineText,
      experienceSelections: profile.contentSelection.experienceSelections,
      educationIds: profile.contentSelection.educationIds,
      skillCategoryIds: profile.contentSelection.skillCategoryIds,
      skillItemIds: profile.contentSelection.skillItemIds,
      keywords: []
    });

    const pdfPath = await this.resumeRenderer.render({
      content,
      companyName: 'Generic'
    });

    return { pdfPath };
  }
}
