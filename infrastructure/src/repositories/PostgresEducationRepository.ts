import { NotFoundError } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  Education as DomainEducation,
  EducationId,
  type EducationRepository,
  EntityNotFoundError
} from '@tailoredin/domain';
import { Education as OrmEducation } from '../db/entities/education/Education.js';
import { Profile as OrmProfile } from '../db/entities/profile/Profile.js';

@injectable()
export class PostgresEducationRepository implements EducationRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findAll(): Promise<DomainEducation[]> {
    const entries = await this.orm.em.findAll(OrmEducation, { orderBy: { ordinal: 'ASC' } });
    return entries.map(e => this.toDomain(e));
  }

  public async findByIdOrFail(id: string): Promise<DomainEducation> {
    try {
      const orm = await this.orm.em.findOneOrFail(OrmEducation, id);
      return this.toDomain(orm);
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Education', id);
      throw e;
    }
  }

  public async save(education: DomainEducation): Promise<void> {
    const existing = await this.orm.em.findOne(OrmEducation, education.id.value);

    if (existing) {
      existing.degreeTitle = education.degreeTitle;
      existing.institutionName = education.institutionName;
      existing.graduationYear = education.graduationYear;
      existing.location = education.location;
      existing.honors = education.honors;
      existing.ordinal = education.ordinal;
      existing.hiddenByDefault = education.hiddenByDefault;
      existing.updatedAt = education.updatedAt;
    } else {
      const orm = new OrmEducation({
        id: education.id.value,
        profile: this.orm.em.getReference(OrmProfile, education.profileId),
        degreeTitle: education.degreeTitle,
        institutionName: education.institutionName,
        graduationYear: education.graduationYear,
        location: education.location,
        honors: education.honors,
        ordinal: education.ordinal,
        hiddenByDefault: education.hiddenByDefault,
        createdAt: education.createdAt,
        updatedAt: education.updatedAt
      });
      this.orm.em.persist(orm);
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    try {
      const orm = await this.orm.em.findOneOrFail(OrmEducation, id);
      this.orm.em.remove(orm);
      await this.orm.em.flush();
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Education', id);
      throw e;
    }
  }

  private toDomain(orm: OrmEducation): DomainEducation {
    return new DomainEducation({
      id: new EducationId(orm.id),
      profileId: orm.profile.id,
      degreeTitle: orm.degreeTitle,
      institutionName: orm.institutionName,
      graduationYear: orm.graduationYear,
      location: orm.location,
      honors: orm.honors,
      ordinal: orm.ordinal,
      hiddenByDefault: orm.hiddenByDefault,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
