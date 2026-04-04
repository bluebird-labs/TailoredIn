import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { HeadlineRepository } from '@tailoredin/domain';
import { Headline as DomainHeadline, HeadlineId } from '@tailoredin/domain';
import { Headline as OrmHeadline } from '../db/entities/headline/Headline.js';

@injectable()
export class PostgresHeadlineRepository implements HeadlineRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainHeadline> {
    const orm = await this.orm.em.findOneOrFail(OrmHeadline, id);
    return this.toDomain(orm);
  }

  public async findAll(): Promise<DomainHeadline[]> {
    const ormEntities = await this.orm.em.find(OrmHeadline, {}, { orderBy: { createdAt: 'ASC' } });
    return ormEntities.map(e => this.toDomain(e));
  }

  public async save(headline: DomainHeadline): Promise<void> {
    const existing = await this.orm.em.findOne(OrmHeadline, headline.id.value);

    if (existing) {
      existing.label = headline.label;
      existing.summaryText = headline.summaryText;
      existing.updatedAt = headline.updatedAt;
      this.orm.em.persist(existing);
    } else {
      const orm = new OrmHeadline({
        id: headline.id.value,
        profileId: headline.profileId,
        label: headline.label,
        summaryText: headline.summaryText,
        createdAt: headline.createdAt,
        updatedAt: headline.updatedAt
      });
      this.orm.em.persist(orm);
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmHeadline, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmHeadline): DomainHeadline {
    return new DomainHeadline({
      id: new HeadlineId(orm.id),
      profileId: orm.profileId,
      label: orm.label,
      summaryText: orm.summaryText,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
