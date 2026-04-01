import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Tag as DomainTag, TagDimension, TagId, type TagRepository } from '@tailoredin/domain';
import { Tag as OrmTag } from '../db/entities/tag/Tag.js';

@injectable()
export class PostgresTagRepository implements TagRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainTag> {
    const orm = await this.orm.em.findOneOrFail(OrmTag, id);
    return this.toDomain(orm);
  }

  public async findByNameAndDimension(name: string, dimension: TagDimension): Promise<DomainTag | null> {
    const orm = await this.orm.em.findOne(OrmTag, { name, dimension });
    return orm ? this.toDomain(orm) : null;
  }

  public async findAllByDimension(dimension: TagDimension): Promise<DomainTag[]> {
    const ormEntities = await this.orm.em.find(OrmTag, { dimension }, { orderBy: { name: 'ASC' } });
    return ormEntities.map(e => this.toDomain(e));
  }

  public async findAll(): Promise<DomainTag[]> {
    const ormEntities = await this.orm.em.find(OrmTag, {}, { orderBy: { dimension: 'ASC', name: 'ASC' } });
    return ormEntities.map(e => this.toDomain(e));
  }

  public async save(tag: DomainTag): Promise<void> {
    const existing = await this.orm.em.findOne(OrmTag, tag.id.value);

    if (existing) {
      // Tags are immutable once created — no update needed
      return;
    }

    const orm = new OrmTag({
      id: tag.id.value,
      name: tag.name,
      dimension: tag.dimension,
      createdAt: tag.createdAt,
    });
    this.orm.em.persist(orm);
    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmTag, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmTag): DomainTag {
    return new DomainTag({
      id: new TagId(orm.id),
      name: orm.name,
      dimension: orm.dimension as TagDimension,
      createdAt: orm.createdAt,
    });
  }
}
