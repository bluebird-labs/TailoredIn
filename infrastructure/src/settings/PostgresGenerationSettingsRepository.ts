import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { GenerationSettings, type GenerationSettingsRepository } from '@tailoredin/domain';

@injectable()
export class PostgresGenerationSettingsRepository implements GenerationSettingsRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByProfileId(profileId: string): Promise<GenerationSettings | null> {
    return this.orm.em.findOne(GenerationSettings, { profileId }, { populate: ['prompts'] });
  }

  public async save(settings: GenerationSettings): Promise<void> {
    this.orm.em.persist(settings);
    await this.orm.em.flush();
  }
}
