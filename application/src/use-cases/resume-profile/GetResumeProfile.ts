import type { ResumeProfile } from '@tailoredin/domain';
import type { ResumeProfileRepository } from '../../ports/ResumeProfileRepository.js';

export type GetResumeProfileInput = {
  profileId: string;
};

export class GetResumeProfile {
  public constructor(private readonly resumeProfileRepository: ResumeProfileRepository) {}

  public async execute(input: GetResumeProfileInput): Promise<ResumeProfile | null> {
    return this.resumeProfileRepository.findByProfileId(input.profileId);
  }
}
