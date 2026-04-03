import { ok, type ProfileRepository, type Result } from '@tailoredin/domain';
import type { GenerateResumeDto } from '../dtos/GenerateResumeDto.js';
import type { ResumeContentFactory } from '../ports/ResumeContentFactory.js';
import { formatResumeAsMarkdown } from '../services/formatResumeAsMarkdown.js';

export type GenerateResumeMarkdownOutput = {
  markdown: string;
};

export class GenerateResumeMarkdown {
  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly resumeContentFactory: ResumeContentFactory
  ) {}

  public async execute(input: GenerateResumeDto): Promise<Result<GenerateResumeMarkdownOutput, Error>> {
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

    const markdown = formatResumeAsMarkdown(content);

    return ok({ markdown });
  }
}
