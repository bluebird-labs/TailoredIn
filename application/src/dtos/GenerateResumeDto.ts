import type { Archetype } from '@tailoredin/domain';

export type GenerateResumeDto = {
  jobId: string;
  archetype?: Archetype;
  keywords?: string[];
};
