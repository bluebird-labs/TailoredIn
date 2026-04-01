import type { Archetype } from '../entities/Archetype.js';

export interface ArchetypeRepository {
  findByIdOrFail(id: string): Promise<Archetype>;
  findAll(): Promise<Archetype[]>;
  save(archetype: Archetype): Promise<void>;
  delete(id: string): Promise<void>;
}
