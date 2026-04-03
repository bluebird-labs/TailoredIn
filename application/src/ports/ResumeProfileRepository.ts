import type { ResumeProfile } from '@tailoredin/domain';

export interface ResumeProfileRepository {
  findByProfileId(profileId: string): Promise<ResumeProfile | null>;
  save(profile: ResumeProfile): Promise<void>;
}
