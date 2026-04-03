import { ContentSelection, TailoredResume } from '@tailoredin/domain';
import type { ResumeProfileRepository } from '../../ports/ResumeProfileRepository.js';
import type { ResumeTailoringService } from '../../ports/ResumeTailoringService.js';
import type { TailoredResumeRepository } from '../../ports/TailoredResumeRepository.js';
import type { GenerateResumeMarkdown } from '../GenerateResumeMarkdown.js';

export type CreateTailoredResumeInput = {
  profileId: string;
  jdContent: string;
};

export class CreateTailoredResume {
  public constructor(
    private readonly resumeProfileRepository: ResumeProfileRepository,
    private readonly tailoredResumeRepository: TailoredResumeRepository,
    private readonly resumeTailoringService: ResumeTailoringService,
    private readonly generateResumeMarkdown: GenerateResumeMarkdown
  ) {}

  public async execute(input: CreateTailoredResumeInput): Promise<TailoredResume> {
    const profile = await this.resumeProfileRepository.findByProfileId(input.profileId);

    if (!profile) {
      throw new Error(`ResumeProfile not found: ${input.profileId}`);
    }

    // Generate raw markdown from the profile's current content selection
    const markdownResult = await this.generateResumeMarkdown.execute({
      headlineText: profile.headlineText,
      experienceSelections: profile.contentSelection.experienceSelections,
      educationIds: profile.contentSelection.educationIds,
      skillCategoryIds: profile.contentSelection.skillCategoryIds,
      skillItemIds: profile.contentSelection.skillItemIds,
      keywords: []
    });

    if (!markdownResult.isOk) {
      throw new Error(`Failed to generate resume markdown: ${markdownResult.error.message}`);
    }

    const llmProposal = await this.resumeTailoringService.tailorFromJd(
      input.jdContent,
      markdownResult.value.markdown
    );

    // Build initial content selection from LLM proposals: all ranked bullets selected by default
    const contentSelection = new ContentSelection({
      experienceSelections: llmProposal.rankedExperiences.map(exp => ({
        experienceId: exp.experienceId,
        bulletIds: exp.rankedBulletIds
      })),
      projectIds: [],
      educationIds: profile.contentSelection.educationIds,
      skillCategoryIds: profile.contentSelection.skillCategoryIds,
      skillItemIds: llmProposal.rankedSkillIds
    });

    const headlineText = llmProposal.headlineOptions[0] ?? profile.headlineText;

    const resume = TailoredResume.create({
      profileId: input.profileId,
      jdContent: input.jdContent
    });

    resume.updateProposals(llmProposal);
    resume.replaceContentSelection(contentSelection);
    resume.updateHeadline(headlineText);

    await this.tailoredResumeRepository.save(resume);

    return resume;
  }
}
