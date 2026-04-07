import type { ExperienceGenerationOverride } from '../entities/ExperienceGenerationOverride.js';

export interface ExperienceGenerationOverrideRepository {
  findByExperienceId(experienceId: string): Promise<ExperienceGenerationOverride | null>;
  findByExperienceIds(experienceIds: string[]): Promise<ExperienceGenerationOverride[]>;
  save(override: ExperienceGenerationOverride): Promise<void>;
  delete(experienceId: string): Promise<void>;
}
