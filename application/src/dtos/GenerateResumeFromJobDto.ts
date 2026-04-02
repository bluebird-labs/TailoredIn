import type { ArchetypeKey } from '@tailoredin/domain';

export type GenerateResumeFromJobDto = {
  jobId: string;
  archetype?: ArchetypeKey;
  keywords?: string[];
};
