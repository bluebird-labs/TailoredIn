import type { Tag, TagDimension } from '../entities/Tag.js';

export interface TagRepository {
  findByIdOrFail(id: string): Promise<Tag>;
  findByNameAndDimension(name: string, dimension: TagDimension): Promise<Tag | null>;
  findAllByDimension(dimension: TagDimension): Promise<Tag[]>;
  findAll(): Promise<Tag[]>;
  save(tag: Tag): Promise<void>;
  delete(id: string): Promise<void>;
}
