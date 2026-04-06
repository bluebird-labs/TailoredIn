import { NotFoundError } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  AccomplishmentId,
  Accomplishment as DomainAccomplishment,
  Experience as DomainExperience,
  EntityNotFoundError,
  ExperienceId,
  type ExperienceRepository
} from '@tailoredin/domain';
import { Company as OrmCompany } from '../db/entities/companies/Company.js';
import { Accomplishment as OrmAccomplishment } from '../db/entities/experience/Accomplishment.js';
import { Experience as OrmExperience } from '../db/entities/experience/Experience.js';
import { Profile } from '../db/entities/profile/Profile.js';

@injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainExperience> {
    try {
      const orm = await this.orm.em.findOneOrFail(OrmExperience, id, { populate: ['profile', 'company'] });
      return this.toDomain(orm);
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Experience', id);
      throw e;
    }
  }

  public async findAll(): Promise<DomainExperience[]> {
    const ormEntities = await this.orm.em.find(
      OrmExperience,
      {},
      { orderBy: { ordinal: 'ASC' }, populate: ['profile', 'company'] }
    );
    return Promise.all(ormEntities.map(e => this.toDomain(e)));
  }

  public async save(experience: DomainExperience): Promise<void> {
    const existing = await this.orm.em.findOne(OrmExperience, experience.id.value);

    if (existing) {
      existing.title = experience.title;
      existing.companyName = experience.companyName;
      existing.companyWebsite = experience.companyWebsite;
      existing.company = experience.companyId ? this.orm.em.getReference(OrmCompany, experience.companyId) : null;
      existing.location = experience.location;
      existing.startDate = experience.startDate;
      existing.endDate = experience.endDate;
      existing.summary = experience.summary;
      existing.ordinal = experience.ordinal;
      existing.updatedAt = experience.updatedAt;
      this.orm.em.persist(existing);
      await this.syncAccomplishments(experience);
    } else {
      const profile = await this.orm.em.findOneOrFail(Profile, experience.profileId);
      const orm = new OrmExperience({
        id: experience.id.value,
        profile,
        title: experience.title,
        companyName: experience.companyName,
        companyWebsite: experience.companyWebsite,
        company: experience.companyId ? this.orm.em.getReference(OrmCompany, experience.companyId) : null,
        location: experience.location,
        startDate: experience.startDate,
        endDate: experience.endDate,
        summary: experience.summary,
        ordinal: experience.ordinal,
        createdAt: experience.createdAt,
        updatedAt: experience.updatedAt
      });
      this.orm.em.persist(orm);

      for (const acc of experience.accomplishments) {
        this.persistNewAccomplishment(acc, orm);
      }
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    try {
      const orm = await this.orm.em.findOneOrFail(OrmExperience, id);
      this.orm.em.remove(orm);
      await this.orm.em.flush();
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Experience', id);
      throw e;
    }
  }

  private async syncAccomplishments(domain: DomainExperience): Promise<void> {
    const existing = await this.orm.em.find(OrmAccomplishment, { experience: domain.id.value });
    const domainIds = new Set(domain.accomplishments.map(a => a.id.value));
    const existingIds = new Set(existing.map(a => a.id));

    for (const orm of existing) {
      if (!domainIds.has(orm.id)) {
        this.orm.em.remove(orm);
      }
    }

    for (const acc of domain.accomplishments) {
      if (existingIds.has(acc.id.value)) {
        const ormAcc = existing.find(a => a.id === acc.id.value)!;
        ormAcc.title = acc.title;
        ormAcc.narrative = acc.narrative;
        ormAcc.ordinal = acc.ordinal;
        ormAcc.updatedAt = acc.updatedAt;
        this.orm.em.persist(ormAcc);
      } else {
        const expRef = this.orm.em.getReference(OrmExperience, domain.id.value);
        this.persistNewAccomplishment(acc, expRef);
      }
    }
  }

  private persistNewAccomplishment(acc: DomainAccomplishment, experience: OrmExperience): void {
    const ormAcc = new OrmAccomplishment({
      id: acc.id.value,
      experience,
      title: acc.title,
      narrative: acc.narrative,
      ordinal: acc.ordinal,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt
    });
    this.orm.em.persist(ormAcc);
  }

  private async toDomain(orm: OrmExperience): Promise<DomainExperience> {
    const profileId = typeof orm.profile === 'string' ? orm.profile : (orm.profile as { id: string }).id;
    const companyId =
      orm.company == null ? null : typeof orm.company === 'string' ? orm.company : (orm.company as { id: string }).id;

    const ormAccomplishments = await this.orm.em.find(
      OrmAccomplishment,
      { experience: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );

    const accomplishments: DomainAccomplishment[] = ormAccomplishments.map(
      a =>
        new DomainAccomplishment({
          id: new AccomplishmentId(a.id),
          experienceId: orm.id,
          title: a.title,
          narrative: a.narrative,
          ordinal: a.ordinal,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt
        })
    );

    return new DomainExperience({
      id: new ExperienceId(orm.id),
      profileId,
      title: orm.title,
      companyName: orm.companyName,
      companyWebsite: orm.companyWebsite,
      companyId,
      location: orm.location,
      startDate: orm.startDate,
      endDate: orm.endDate,
      summary: orm.summary,
      ordinal: orm.ordinal,
      accomplishments,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
