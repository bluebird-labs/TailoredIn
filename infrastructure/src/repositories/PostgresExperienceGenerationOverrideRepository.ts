import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  ExperienceGenerationOverride as DomainOverride,
  ExperienceGenerationOverrideId,
  type ExperienceGenerationOverrideRepository
} from '@tailoredin/domain';
import { Experience as OrmExperience } from '../db/entities/experience/Experience.js';
import { ExperienceGenerationOverride as OrmOverride } from '../db/entities/experience/ExperienceGenerationOverride.js';

@injectable()
export class PostgresExperienceGenerationOverrideRepository implements ExperienceGenerationOverrideRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByExperienceId(experienceId: string): Promise<DomainOverride | null> {
    const orm = await this.orm.em.findOne(OrmOverride, { experience: experienceId }, { populate: ['experience'] });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  public async findByExperienceIds(experienceIds: string[]): Promise<DomainOverride[]> {
    if (experienceIds.length === 0) return [];
    const ormEntities = await this.orm.em.find(
      OrmOverride,
      // biome-ignore lint/style/useNamingConvention: MikroORM query operator
      { experience: { $in: experienceIds } },
      { populate: ['experience'] }
    );
    return ormEntities.map(orm => this.toDomain(orm));
  }

  public async save(override: DomainOverride): Promise<void> {
    const existing = await this.orm.em.findOne(OrmOverride, override.id.value);

    if (existing) {
      existing.bulletMin = override.bulletMin;
      existing.bulletMax = override.bulletMax;
      existing.updatedAt = override.updatedAt;
      this.orm.em.persist(existing);
    } else {
      const experience = this.orm.em.getReference(OrmExperience, override.experienceId);
      const orm = new OrmOverride({
        id: override.id.value,
        experience,
        bulletMin: override.bulletMin,
        bulletMax: override.bulletMax,
        createdAt: override.createdAt,
        updatedAt: override.updatedAt
      });
      this.orm.em.persist(orm);
    }

    await this.orm.em.flush();
  }

  public async delete(experienceId: string): Promise<void> {
    const orm = await this.orm.em.findOne(OrmOverride, { experience: experienceId });
    if (orm) {
      this.orm.em.remove(orm);
      await this.orm.em.flush();
    }
  }

  private toDomain(orm: OrmOverride): DomainOverride {
    const experienceId = typeof orm.experience === 'string' ? orm.experience : (orm.experience as { id: string }).id;

    return new DomainOverride({
      id: new ExperienceGenerationOverrideId(orm.id),
      experienceId,
      bulletMin: orm.bulletMin,
      bulletMax: orm.bulletMax,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
