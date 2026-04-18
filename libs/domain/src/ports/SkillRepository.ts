import type { Skill } from '../entities/Skill.js';

export interface SkillRepository {
  findByIds(ids: string[]): Promise<Skill[]>;
  search(query: string, limit: number): Promise<Skill[]>;
  findAll(): Promise<Skill[]>;
  findByNormalizedLabel(normalizedLabel: string): Promise<Skill | null>;
}
