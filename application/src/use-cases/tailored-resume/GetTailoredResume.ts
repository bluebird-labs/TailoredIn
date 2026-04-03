import { TailoredResumeId, type TailoredResume } from '@tailoredin/domain';
import type { TailoredResumeRepository } from '../../ports/TailoredResumeRepository.js';

export type GetTailoredResumeInput = {
  resumeId: string;
};

export class GetTailoredResume {
  public constructor(private readonly tailoredResumeRepository: TailoredResumeRepository) {}

  public async execute(input: GetTailoredResumeInput): Promise<TailoredResume | null> {
    return this.tailoredResumeRepository.findById(new TailoredResumeId(input.resumeId));
  }
}
