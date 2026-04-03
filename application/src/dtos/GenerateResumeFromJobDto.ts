import type { ArchetypeKey, TemplateKey } from '@tailoredin/domain';

export type GenerateResumeFromJobDto = {
  jobId: string;
  archetype?: ArchetypeKey;
  keywords?: string[];
  templateKey?: TemplateKey;
};
