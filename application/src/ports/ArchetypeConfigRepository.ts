import type { Archetype, ArchetypeConfig } from '@tailoredin/domain';

export interface ArchetypeConfigRepository {
  findByIdOrFail(id: string): Promise<ArchetypeConfig>;
  findByUserAndKey(userId: string, key: Archetype): Promise<ArchetypeConfig | null>;
  findAllByUserId(userId: string): Promise<ArchetypeConfig[]>;
  save(config: ArchetypeConfig): Promise<void>;
  delete(id: string): Promise<void>;
}
