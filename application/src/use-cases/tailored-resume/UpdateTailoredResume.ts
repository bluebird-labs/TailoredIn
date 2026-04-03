import { ContentSelection, TailoredResumeId } from '@tailoredin/domain';
import type { ContentSelectionDto } from '../../dtos/ContentSelectionDto.js';
import type { TailoredResumeRepository } from '../../ports/TailoredResumeRepository.js';

export type UpdateTailoredResumeInput = {
  resumeId: string;
  contentSelection: ContentSelectionDto;
  headlineText: string;
};

export class UpdateTailoredResume {
  public constructor(private readonly tailoredResumeRepository: TailoredResumeRepository) {}

  public async execute(input: UpdateTailoredResumeInput): Promise<void> {
    const resume = await this.tailoredResumeRepository.findById(new TailoredResumeId(input.resumeId));

    if (!resume) {
      throw new Error(`TailoredResume not found: ${input.resumeId}`);
    }

    resume.replaceContentSelection(new ContentSelection(input.contentSelection));
    resume.updateHeadline(input.headlineText);

    await this.tailoredResumeRepository.save(resume);
  }
}
