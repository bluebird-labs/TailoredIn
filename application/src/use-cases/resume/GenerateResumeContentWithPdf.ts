import { Inject, Injectable } from '@nestjs/common';
import { DI } from '../../DI.js';
import type { ResumeContentDto } from '../../dtos/ResumeContentDto.js';
import type { GenerateResumeContent, GenerateResumeContentInput } from './GenerateResumeContent.js';
import type { GenerateResumePdf } from './GenerateResumePdf.js';

@Injectable()
export class GenerateResumeContentWithPdf {
  public constructor(
    @Inject(DI.Resume.Generate) private readonly generateContent: GenerateResumeContent,
    @Inject(DI.Resume.GeneratePdf) private readonly generatePdf: GenerateResumePdf
  ) {}

  public async execute(input: GenerateResumeContentInput): Promise<ResumeContentDto> {
    const content = await this.generateContent.execute(input);

    try {
      await this.generatePdf.execute({ profileId: input.profileId, jobDescriptionId: input.jobDescriptionId });
    } catch {
      // PDF generation is best-effort — content was already saved
    }

    return content;
  }
}
