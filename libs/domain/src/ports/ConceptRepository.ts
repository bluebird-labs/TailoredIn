import type { Concept } from '../entities/Concept.js';

export interface ConceptRepository {
  findAll(): Promise<Concept[]>;
}
