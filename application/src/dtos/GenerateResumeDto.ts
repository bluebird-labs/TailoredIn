import type { ArchetypeKey } from '@tailoredin/domain';

export type GenerateResumeDto = {
  jobId: string;
  archetype?: ArchetypeKey;
  keywords?: string[];
};
