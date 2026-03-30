import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  ResumeHeadline as DomainResumeHeadline,
  ResumeHeadlineId,
  type ResumeHeadlineRepository
} from '@tailoredin/domain';
import { ResumeHeadline as OrmResumeHeadline } from '../db/entities/resume/ResumeHeadline.js';
import { User as OrmUser } from '../db/entities/users/User.js';

@injectable()
export class PostgresResumeHeadlineRepository implements ResumeHeadlineRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainResumeHeadline> {
    const orm = await this.orm.em.findOneOrFail(OrmResumeHeadline, id, { populate: ['user'] });
    return this.toDomain(orm);
  }

  public async findAllByUserId(userId: string): Promise<DomainResumeHeadline[]> {
    const ormEntities = await this.orm.em.find(OrmResumeHeadline, { user: userId });
    return ormEntities.map(e => this.toDomain(e, userId));
  }

  public async save(headline: DomainResumeHeadline): Promise<void> {
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

  public async delete(id: string): Promise<void> {
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
