import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { GenerationSettings, type GenerationSettingsRepository } from '@tailoredin/domain';

@Injectable()
export class PostgresGenerationSettingsRepository implements GenerationSettingsRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findByProfileId(profileId: string): Promise<GenerationSettings | null> {
    return this.orm.em.findOne(GenerationSettings, { profileId }, { populate: ['prompts'] });
  }

  public async save(settings: GenerationSettings): Promise<void> {
    this.orm.em.persist(settings);
    await this.orm.em.flush();
  }
}
