import type { GenerationSettings } from '../entities/GenerationSettings.js';

export interface GenerationSettingsRepository {
  findByProfileId(profileId: string): Promise<GenerationSettings | null>;
  save(settings: GenerationSettings): Promise<void>;
}
