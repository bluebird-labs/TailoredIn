import type { Headline } from '../entities/Headline.js';

export interface HeadlineRepository {
  findByIdOrFail(id: string): Promise<Headline>;
  findAll(): Promise<Headline[]>;
  save(headline: Headline): Promise<void>;
  delete(id: string): Promise<void>;
}
