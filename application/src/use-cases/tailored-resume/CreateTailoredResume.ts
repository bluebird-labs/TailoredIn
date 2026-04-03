import { ContentSelection, GeneratedContent, TailoredResume } from '@tailoredin/domain';
import type { ResumeChestQuery } from '../../ports/ResumeChestQuery.js';
import type { ResumeProfileRepository } from '../../ports/ResumeProfileRepository.js';
import type { ResumeTailoringService } from '../../ports/ResumeTailoringService.js';
import type { TailoredResumeRepository } from '../../ports/TailoredResumeRepository.js';

export type CreateTailoredResumeInput = {
  profileId: string;
  jdContent: string;
};

export class CreateTailoredResume {
  public constructor(
    private readonly resumeProfileRepository: ResumeProfileRepository,
    private readonly tailoredResumeRepository: TailoredResumeRepository,
    private readonly resumeTailoringService: ResumeTailoringService,
    private readonly resumeChestQuery: ResumeChestQuery
  ) {}

  public async execute(input: CreateTailoredResumeInput): Promise<TailoredResume> {
    const profile = await this.resumeProfileRepository.findByProfileId(input.profileId);

    if (!profile) {
      throw new Error(`ResumeProfile not found: ${input.profileId}`);
    }

    // Build a rich chest markdown from ALL experiences + verbose bullet descriptions
    const chestMarkdown = await this.resumeChestQuery.makeChestMarkdown(input.profileId);

    const llmProposal = await this.resumeTailoringService.tailorFromJd(input.jdContent, chestMarkdown);

    // Build generated content from LLM-written bullet texts
    const generatedContent = new GeneratedContent(
      llmProposal.generatedExperiences.map(exp => ({
        experienceId: exp.experienceId,
        bulletTexts: exp.bulletTexts
      }))
    );

    // Keep a ranked content selection as reference / fallback for base resume rendering
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
    resume.updateGeneratedContent(generatedContent);
    resume.updateHeadline(headlineText);

    await this.tailoredResumeRepository.save(resume);

    return resume;
  }
}
