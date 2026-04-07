import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  GenerationPrompt as DomainGenerationPrompt,
  GenerationSettings as DomainGenerationSettings,
  GenerationPromptId,
  type GenerationScope,
  GenerationSettingsId,
  type GenerationSettingsRepository
} from '@tailoredin/domain';
import { GenerationPrompt as OrmGenerationPrompt } from '../db/entities/generation-settings/GenerationPrompt.js';
import { GenerationSettings as OrmGenerationSettings } from '../db/entities/generation-settings/GenerationSettings.js';
import { Profile } from '../db/entities/profile/Profile.js';

@injectable()
export class PostgresGenerationSettingsRepository implements GenerationSettingsRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByProfileId(profileId: string): Promise<DomainGenerationSettings | null> {
    const orm = await this.orm.em.findOne(
      OrmGenerationSettings,
      { profile: profileId },
      { populate: ['prompts', 'profile'] }
    );
    if (!orm) return null;
    return this.toDomain(orm);
  }

  public async save(settings: DomainGenerationSettings): Promise<void> {
    const existing = await this.orm.em.findOne(OrmGenerationSettings, settings.id.value);

    if (existing) {
      await this.orm.em
        .createQueryBuilder(OrmGenerationSettings)
        .update({
          modelTier: settings.modelTier,
          bulletMin: settings.bulletMin,
          bulletMax: settings.bulletMax,
          updatedAt: settings.updatedAt
        })
        .where({ id: settings.id.value })
        .execute();
      await this.syncPrompts(settings);
    } else {
      const settingsRef = this.orm.em.getReference(Profile, settings.profileId);
      const orm = new OrmGenerationSettings({
        id: settings.id.value,
        profile: settingsRef,
        modelTier: settings.modelTier,
        bulletMin: settings.bulletMin,
        bulletMax: settings.bulletMax,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      });
      await this.orm.em.insertMany([orm]);

      for (const prompt of settings.prompts) {
        await this.insertPrompt(prompt, settings.id.value);
      }
    }
  }

  private async syncPrompts(settings: DomainGenerationSettings): Promise<void> {
    const existing = await this.orm.em.find(OrmGenerationPrompt, { generationSettings: settings.id.value });
    const domainIds = new Set(settings.prompts.map(p => p.id.value));
    const existingIds = new Set(existing.map(p => p.id));

    // Delete removed prompts
    const toDelete = existing.filter(orm => !domainIds.has(orm.id)).map(orm => orm.id);
    if (toDelete.length > 0) {
      await this.orm.em
        .createQueryBuilder(OrmGenerationPrompt)
        .delete()
        // biome-ignore lint/style/useNamingConvention: MikroORM query operator
        .where({ id: { $in: toDelete } })
        .execute();
    }

    // Upsert prompts
    for (const prompt of settings.prompts) {
      if (existingIds.has(prompt.id.value)) {
        await this.orm.em
          .createQueryBuilder(OrmGenerationPrompt)
          .update({
            scope: prompt.scope,
            content: prompt.content,
            updatedAt: prompt.updatedAt
          })
          .where({ id: prompt.id.value })
          .execute();
      } else {
        await this.insertPrompt(prompt, settings.id.value);
      }
    }
  }

  private async insertPrompt(prompt: DomainGenerationPrompt, generationSettingsId: string): Promise<void> {
    const settingsRef = this.orm.em.getReference(OrmGenerationSettings, generationSettingsId);
    const orm = new OrmGenerationPrompt({
      id: prompt.id.value,
      generationSettings: settingsRef,
      scope: prompt.scope,
      content: prompt.content,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt
    });
    await this.orm.em.insertMany([orm]);
  }

  private toDomain(orm: OrmGenerationSettings): DomainGenerationSettings {
    const profileId = typeof orm.profile === 'string' ? orm.profile : (orm.profile as { id: string }).id;

    const prompts = orm.prompts.getItems().map(
      p =>
        new DomainGenerationPrompt({
          id: new GenerationPromptId(p.id),
          scope: p.scope as GenerationScope,
          content: p.content,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        })
    );

    return new DomainGenerationSettings({
      id: new GenerationSettingsId(orm.id),
      profileId,
      modelTier: orm.modelTier as DomainGenerationSettings['modelTier'],
      bulletMin: orm.bulletMin,
      bulletMax: orm.bulletMax,
      prompts,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
