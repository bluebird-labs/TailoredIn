import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { ExperienceGenerationOverride, type ExperienceGenerationOverrideRepository } from '@tailoredin/domain';

@injectable()
export class PostgresExperienceGenerationOverrideRepository implements ExperienceGenerationOverrideRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByExperienceId(experienceId: string): Promise<ExperienceGenerationOverride | null> {
    return this.orm.em.findOne(ExperienceGenerationOverride, { experienceId });
  }

  public async findByExperienceIds(experienceIds: string[]): Promise<ExperienceGenerationOverride[]> {
    if (experienceIds.length === 0) return [];
    return this.orm.em.find(
      ExperienceGenerationOverride,
      // biome-ignore lint/style/useNamingConvention: MikroORM query operator
      { experienceId: { $in: experienceIds } }
    );
  }

  public async save(override: ExperienceGenerationOverride): Promise<void> {
    this.orm.em.persist(override);
    await this.orm.em.flush();
  }

  public async delete(experienceId: string): Promise<void> {
    const orm = await this.orm.em.findOne(ExperienceGenerationOverride, { experienceId });
    if (orm) {
      this.orm.em.remove(orm);
      await this.orm.em.flush();
    }
  }
}
