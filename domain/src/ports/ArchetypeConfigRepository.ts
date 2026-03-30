import type { ArchetypeConfig } from '../entities/ArchetypeConfig.js';
import type { Archetype } from '../value-objects/Archetype.js';

export interface ArchetypeConfigRepository {
  findByIdOrFail(id: string): Promise<ArchetypeConfig>;
  findByUserAndKey(userId: string, key: Archetype): Promise<ArchetypeConfig | null>;
  findAllByUserId(userId: string): Promise<ArchetypeConfig[]>;
  save(config: ArchetypeConfig): Promise<void>;
  delete(id: string): Promise<void>;
}
