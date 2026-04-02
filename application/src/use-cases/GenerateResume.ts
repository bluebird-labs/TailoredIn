import { Logger } from '@tailoredin/core';
import { ok, type ProfileRepository, type Result } from '@tailoredin/domain';
import type { BuildResumeOutputDto } from '../dtos/BuildResumeOutputDto.js';
import type { GenerateResumeDto } from '../dtos/GenerateResumeDto.js';
import type { ResumeContentFactory } from '../ports/ResumeContentFactory.js';
import type { ResumeRenderer } from '../ports/ResumeRenderer.js';

const DEFAULT_AWESOME_COLOR = '#0395DE';

export class GenerateResume {
  private readonly log = Logger.create(GenerateResume.name);

  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly resumeContentFactory: ResumeContentFactory,
    private readonly resumeRenderer: ResumeRenderer
  ) {}

  public async execute(input: GenerateResumeDto): Promise<Result<BuildResumeOutputDto, Error>> {
    const profile = await this.profileRepository.findSingle();

    const content = await this.resumeContentFactory.makeFromSelection({
      profileId: profile.id.value,
      headlineId: input.headlineId,
      experienceSelections: input.experienceSelections,
      educationIds: input.educationIds,
      skillCategoryIds: input.skillCategoryIds,
      skillItemIds: input.skillItemIds,
      awesomeColor: DEFAULT_AWESOME_COLOR,
      keywords: input.keywords ?? []
    });

    this.log.info('Rendering resume PDF...');

    const pdfPath = await this.resumeRenderer.render({
      content,
      companyName: 'Generic',
      templateStyle: input.templateStyle
    });

    return ok({ pdfPath });
  }
}
