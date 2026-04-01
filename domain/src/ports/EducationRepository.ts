import type { Education } from '../entities/Education.js';

export interface EducationRepository {
  findAll(): Promise<Education[]>;
  findByIdOrFail(id: string): Promise<Education>;
  save(education: Education): Promise<void>;
  delete(id: string): Promise<void>;
}
