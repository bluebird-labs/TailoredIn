import type { MikroORM } from '@mikro-orm/postgresql';
import { injectable } from '@needle-di/core';
import {
  ResumeEducation as DomainResumeEducation,
  ResumeEducationId,
  type ResumeEducationRepository
} from '@tailoredin/domain';
import { ResumeEducation as OrmResumeEducation } from '../db/entities/resume/ResumeEducation.js';
import { User as OrmUser } from '../db/entities/users/User.js';

@injectable()
export class PostgresResumeEducationRepository implements ResumeEducationRepository {
  public constructor(private readonly orm: MikroORM) {}

  public async findAllByUserId(userId: string): Promise<DomainResumeEducation[]> {
    const ormEntities = await this.orm.em.find(OrmResumeEducation, { user: userId }, { orderBy: { ordinal: 'ASC' } });
    return ormEntities.map(e => this.toDomain(e, userId));
  }

  public async save(education: DomainResumeEducation): Promise<void> {
    const existing = await this.orm.em.findOne(OrmResumeEducation, education.id.value);

    if (existing) {
      existing.degreeTitle = education.degreeTitle;
      existing.institutionName = education.institutionName;
      existing.graduationYear = education.graduationYear;
      existing.locationLabel = education.locationLabel;
      existing.ordinal = education.ordinal;
      existing.updatedAt = education.updatedAt;
      this.orm.em.persist(existing);
    } else {
      const userRef = this.orm.em.getReference(OrmUser, education.userId);
      const orm = new OrmResumeEducation({
        id: education.id.value,
        user: userRef,
        degreeTitle: education.degreeTitle,
        institutionName: education.institutionName,
        graduationYear: education.graduationYear,
        locationLabel: education.locationLabel,
        ordinal: education.ordinal,
        createdAt: education.createdAt,
        updatedAt: education.updatedAt
      });
      this.orm.em.persist(orm);
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmResumeEducation, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmResumeEducation, userId: string): DomainResumeEducation {
    return new DomainResumeEducation({
      id: new ResumeEducationId(orm.id),
      userId,
      degreeTitle: orm.degreeTitle,
      institutionName: orm.institutionName,
      graduationYear: orm.graduationYear,
      locationLabel: orm.locationLabel,
      ordinal: orm.ordinal,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
