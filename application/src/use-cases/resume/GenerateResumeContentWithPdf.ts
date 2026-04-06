import type { ResumeContentDto } from '../../dtos/ResumeContentDto.js';
import type { GenerateResumeContent, GenerateResumeContentInput } from './GenerateResumeContent.js';
import type { GenerateResumePdf } from './GenerateResumePdf.js';

export class GenerateResumeContentWithPdf {
  public constructor(
    private readonly generateContent: GenerateResumeContent,
    private readonly generatePdf: GenerateResumePdf
  ) {}

  public async execute(input: GenerateResumeContentInput): Promise<ResumeContentDto> {
    const content = await this.generateContent.execute(input);

    try {
      await this.generatePdf.execute({ jobDescriptionId: input.jobDescriptionId });
    } catch {
      // PDF generation is best-effort — content was already saved
    }

    return content;
  }
}
