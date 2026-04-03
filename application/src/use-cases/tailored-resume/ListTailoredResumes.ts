import type { TailoredResume } from '@tailoredin/domain';
import type { TailoredResumeRepository } from '../../ports/TailoredResumeRepository.js';

export type ListTailoredResumesInput = {
  profileId: string;
};

export class ListTailoredResumes {
  public constructor(private readonly tailoredResumeRepository: TailoredResumeRepository) {}

  public async execute(input: ListTailoredResumesInput): Promise<TailoredResume[]> {
    return this.tailoredResumeRepository.findByProfileId(input.profileId);
  }
}
