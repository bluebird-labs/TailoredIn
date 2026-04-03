import { ContentSelection, ResumeProfile } from '@tailoredin/domain';
import type { ContentSelectionDto } from '../../dtos/ContentSelectionDto.js';
import type { ResumeProfileRepository } from '../../ports/ResumeProfileRepository.js';

export type UpdateResumeProfileInput = {
  profileId: string;
  contentSelection: ContentSelectionDto;
  headlineText: string;
};

export class UpdateResumeProfile {
  public constructor(private readonly resumeProfileRepository: ResumeProfileRepository) {}

  public async execute(input: UpdateResumeProfileInput): Promise<void> {
    let profile = await this.resumeProfileRepository.findByProfileId(input.profileId);

    if (!profile) {
      profile = ResumeProfile.create(input.profileId);
    }

    profile.replaceContentSelection(new ContentSelection(input.contentSelection));
    profile.updateHeadline(input.headlineText);

    await this.resumeProfileRepository.save(profile);
  }
}
