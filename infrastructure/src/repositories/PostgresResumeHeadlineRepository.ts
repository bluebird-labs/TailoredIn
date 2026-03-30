import type { MikroORM } from '@mikro-orm/postgresql';
import { injectable } from '@needle-di/core';
import {
  ResumeHeadline as DomainResumeHeadline,
  ResumeHeadlineId,
  type ResumeHeadlineRepository
} from '@tailoredin/domain';
import { ResumeHeadline as OrmResumeHeadline } from '../db/entities/resume/ResumeHeadline.js';
import { User as OrmUser } from '../db/entities/users/User.js';

@injectable()
export class PostgresResumeHeadlineRepository implements ResumeHeadlineRepository {
  constructor(private readonly orm: MikroORM) {}

  async findByIdOrFail(id: string): Promise<DomainResumeHeadline> {
    const orm = await this.orm.em.findOneOrFail(OrmResumeHeadline, id, { populate: ['user'] });
    return this.toDomain(orm);
  }

  async findAllByUserId(userId: string): Promise<DomainResumeHeadline[]> {
    const ormEntities = await this.orm.em.find(OrmResumeHeadline, { user: userId });
    return ormEntities.map(e => this.toDomain(e, userId));
  }

  async save(headline: DomainResumeHeadline): Promise<void> {
    const existing = await this.orm.em.findOne(OrmResumeHeadline, headline.id.value);

    if (existing) {
      existing.headlineLabel = headline.headlineLabel;
      existing.summaryText = headline.summaryText;
      existing.updatedAt = headline.updatedAt;
      this.orm.em.persist(existing);
    } else {
      const userRef = this.orm.em.getReference(OrmUser, headline.userId);
      const orm = new OrmResumeHeadline({
        id: headline.id.value,
        user: userRef,
        headlineLabel: headline.headlineLabel,
        summaryText: headline.summaryText,
        createdAt: headline.createdAt,
        updatedAt: headline.updatedAt
      });
      this.orm.em.persist(orm);
    }

    await this.orm.em.flush();
  }

  async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmResumeHeadline, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmResumeHeadline, userId?: string): DomainResumeHeadline {
    const resolvedUserId = userId ?? (typeof orm.user === 'string' ? orm.user : (orm.user as { id: string }).id);
    return new DomainResumeHeadline({
      id: new ResumeHeadlineId(orm.id),
      userId: resolvedUserId,
      headlineLabel: orm.headlineLabel,
      summaryText: orm.summaryText,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
