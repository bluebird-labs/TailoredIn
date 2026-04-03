import { Logger } from '@tailoredin/core';
import { ok, type ProfileRepository, type Result } from '@tailoredin/domain';
import type { BuildResumeOutputDto } from '../dtos/BuildResumeOutputDto.js';
import type { GenerateResumeDto } from '../dtos/GenerateResumeDto.js';
import type { ResumeContentFactory } from '../ports/ResumeContentFactory.js';
import type { ResumeRenderer } from '../ports/ResumeRenderer.js';

export class GenerateResume {
  private readonly log = Logger.create(GenerateResume.name);

  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly resumeContentFactory: ResumeContentFactory,
    private readonly resumeRenderer: ResumeRenderer
  ) {}

  public async execute(input: GenerateResumeDto): Promise<Result<BuildResumeOutputDto, Error>> {
    try {
      const profile = await this.profileRepository.findSingle();

      const content = await this.resumeContentFactory.makeFromSelection({
        profileId: profile.id.value,
        headlineText: input.headlineText,
        experienceSelections: input.experienceSelections,
        educationIds: input.educationIds,
        skillCategoryIds: input.skillCategoryIds,
        skillItemIds: input.skillItemIds,
        keywords: input.keywords ?? []
      });

      this.log.info('Rendering resume PDF...');

      const pdfPath = await this.resumeRenderer.render({
        content,
        companyName: 'Generic'
      });

      return ok({ pdfPath });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
