import type { TailoredResume, TailoredResumeId } from '@tailoredin/domain';

export interface TailoredResumeRepository {
  findById(id: TailoredResumeId): Promise<TailoredResume | null>;
  findByProfileId(profileId: string): Promise<TailoredResume[]>;
  save(resume: TailoredResume): Promise<void>;
}
