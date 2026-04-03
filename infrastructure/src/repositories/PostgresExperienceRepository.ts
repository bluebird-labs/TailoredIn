import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  Accomplishment as DomainAccomplishment,
  AccomplishmentId,
  Experience as DomainExperience,
  ExperienceId,
  type ExperienceRepository
} from '@tailoredin/domain';
import { Accomplishment as OrmAccomplishment } from '../db/entities/experience/Accomplishment.js';
import { Experience as OrmExperience } from '../db/entities/experience/Experience.js';
import { Profile } from '../db/entities/profile/Profile.js';

@injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainExperience> {
    const orm = await this.orm.em.findOneOrFail(OrmExperience, id);
    return this.toDomain(orm);
  }

  public async findAll(): Promise<DomainExperience[]> {
    const ormEntities = await this.orm.em.find(OrmExperience, {}, { orderBy: { ordinal: 'ASC' } });
    return Promise.all(ormEntities.map(e => this.toDomain(e)));
  }

  public async save(experience: DomainExperience): Promise<void> {
    const existing = await this.orm.em.findOne(OrmExperience, experience.id.value);

    if (existing) {
      existing.title = experience.title;
      existing.companyName = experience.companyName;
      existing.companyWebsite = experience.companyWebsite;
      existing.location = experience.location;
      existing.startDate = experience.startDate;
      existing.endDate = experience.endDate;
      existing.summary = experience.summary;
      existing.narrative = experience.narrative;
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
        location: experience.location,
        startDate: experience.startDate,
        endDate: experience.endDate,
        summary: experience.summary,
        narrative: experience.narrative,
        ordinal: experience.ordinal,
        createdAt: experience.createdAt,
        updatedAt: experience.updatedAt
      });
      this.orm.em.persist(orm);

      for (const acc of experience.accomplishments) {
        await this.persistNewAccomplishment(acc, orm);
      }
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmExperience, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
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
        ormAcc.skillTags = acc.skillTags;
        ormAcc.ordinal = acc.ordinal;
        ormAcc.updatedAt = acc.updatedAt;
        this.orm.em.persist(ormAcc);
      } else {
        const expRef = this.orm.em.getReference(OrmExperience, domain.id.value);
        await this.persistNewAccomplishment(acc, expRef);
      }
    }
  }

  private async persistNewAccomplishment(
    acc: DomainAccomplishment,
    experience: OrmExperience
  ): Promise<void> {
    const ormAcc = new OrmAccomplishment({
      id: acc.id.value,
      experience,
      title: acc.title,
      narrative: acc.narrative,
      skillTags: acc.skillTags,
      ordinal: acc.ordinal,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt
    });
    this.orm.em.persist(ormAcc);
  }

  private async toDomain(orm: OrmExperience): Promise<DomainExperience> {
    const [row] = await this.orm.em
      .getConnection()
      .execute<[{ profile_id: string }]>(
        `SELECT profile_id FROM experiences WHERE id = '${orm.id}'`
      );
    const profileId = row.profile_id;

    const ormAccomplishments = await this.orm.em.find(
      OrmAccomplishment,
      { experience: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );

    const accomplishments: DomainAccomplishment[] = ormAccomplishments.map(a =>
      new DomainAccomplishment({
        id: new AccomplishmentId(a.id),
        experienceId: orm.id,
        title: a.title,
        narrative: a.narrative,
        skillTags: a.skillTags,
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
      location: orm.location,
      startDate: orm.startDate,
      endDate: orm.endDate,
      summary: orm.summary,
      narrative: orm.narrative,
      ordinal: orm.ordinal,
      accomplishments,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
