import type { Archetype2 } from '../entities/Archetype2.js';

export interface ArchetypeRepository2 {
  findByIdOrFail(id: string): Promise<Archetype2>;
  findAll(): Promise<Archetype2[]>;
  save(archetype: Archetype2): Promise<void>;
  delete(id: string): Promise<void>;
}
