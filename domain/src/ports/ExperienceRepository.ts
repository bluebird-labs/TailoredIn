import type { Experience } from '../entities/Experience.js';

export interface ExperienceRepository {
  findByIdOrFail(id: string): Promise<Experience>;
  findAll(): Promise<Experience[]>;
  save(experience: Experience): Promise<void>;
  delete(id: string): Promise<void>;
}
