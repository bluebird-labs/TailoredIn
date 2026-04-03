import { TailoredResumeId, type ResumeTemplate } from '@tailoredin/domain';
import type { ResumeContentFactory } from '../../ports/ResumeContentFactory.js';
import type { ResumeRenderer } from '../../ports/ResumeRenderer.js';
import type { TailoredResumeRepository } from '../../ports/TailoredResumeRepository.js';

export type GenerateTailoredResumePdfInput = {
  resumeId: string;
};

export type GenerateTailoredResumePdfOutput = {
  pdfPath: string;
};

export class GenerateTailoredResumePdf {
  public constructor(
    private readonly tailoredResumeRepository: TailoredResumeRepository,
    private readonly resumeContentFactory: ResumeContentFactory,
    private readonly resumeRenderer: ResumeRenderer,
    private readonly template: ResumeTemplate
  ) {}

  public async execute(input: GenerateTailoredResumePdfInput): Promise<GenerateTailoredResumePdfOutput> {
    const resume = await this.tailoredResumeRepository.findById(new TailoredResumeId(input.resumeId));

    if (!resume) {
      throw new Error(`TailoredResume not found: ${input.resumeId}`);
    }

    // Prefer LLM-generated bullet texts from chest when available
    const content = resume.generatedContent.isEmpty()
      ? await this.resumeContentFactory.makeFromSelection({
          profileId: resume.profileId,
          headlineText: resume.headlineText,
          experienceSelections: resume.contentSelection.experienceSelections,
          educationIds: resume.contentSelection.educationIds,
          skillCategoryIds: resume.contentSelection.skillCategoryIds,
          skillItemIds: resume.contentSelection.skillItemIds,
          keywords: []
        })
      : await this.resumeContentFactory.makeFromGeneratedContent({
          profileId: resume.profileId,
          headlineText: resume.headlineText,
          generatedContent: resume.generatedContent,
          educationIds: resume.contentSelection.educationIds,
          skillCategoryIds: resume.contentSelection.skillCategoryIds,
          skillItemIds: resume.contentSelection.skillItemIds,
          keywords: []
        });

    const pdfPath = await this.resumeRenderer.render({
      content,
      companyName: 'Generic',
      template: this.template
    });

    resume.finalize(pdfPath);
    await this.tailoredResumeRepository.save(resume);

    return { pdfPath };
  }
}
