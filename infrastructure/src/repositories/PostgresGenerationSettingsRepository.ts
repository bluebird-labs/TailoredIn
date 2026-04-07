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
    const orm = await this.orm.em.findOne(OrmGenerationSettings, { profile: profileId }, { populate: ['prompts'] });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  public async save(settings: DomainGenerationSettings): Promise<void> {
    const existing = await this.orm.em.findOne(OrmGenerationSettings, settings.id.value);

    if (existing) {
      existing.modelTier = settings.modelTier;
      existing.bulletMin = settings.bulletMin;
      existing.bulletMax = settings.bulletMax;
      existing.updatedAt = settings.updatedAt;
      this.orm.em.persist(existing);
      await this.syncPrompts(settings);
    } else {
      const profile = await this.orm.em.findOneOrFail(Profile, settings.profileId);
      const orm = new OrmGenerationSettings({
        id: settings.id.value,
        profile,
        modelTier: settings.modelTier,
        bulletMin: settings.bulletMin,
        bulletMax: settings.bulletMax,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      });
      this.orm.em.persist(orm);

      for (const prompt of settings.prompts) {
        this.persistNewPrompt(prompt, orm);
      }
    }

    await this.orm.em.flush();
  }

  private async syncPrompts(settings: DomainGenerationSettings): Promise<void> {
    const existing = await this.orm.em.find(OrmGenerationPrompt, { generationSettings: settings.id.value });
    const domainIds = new Set(settings.prompts.map(p => p.id.value));
    const existingIds = new Set(existing.map(p => p.id));

    for (const orm of existing) {
      if (!domainIds.has(orm.id)) {
        this.orm.em.remove(orm);
      }
    }

    for (const prompt of settings.prompts) {
      if (existingIds.has(prompt.id.value)) {
        const ormPrompt = existing.find(p => p.id === prompt.id.value)!;
        ormPrompt.scope = prompt.scope;
        ormPrompt.content = prompt.content;
        ormPrompt.updatedAt = prompt.updatedAt;
        this.orm.em.persist(ormPrompt);
      } else {
        const settingsRef = this.orm.em.getReference(OrmGenerationSettings, settings.id.value);
        this.persistNewPrompt(prompt, settingsRef);
      }
    }
  }

  private persistNewPrompt(prompt: DomainGenerationPrompt, generationSettings: OrmGenerationSettings): void {
    const orm = new OrmGenerationPrompt({
      id: prompt.id.value,
      generationSettings,
      scope: prompt.scope,
      content: prompt.content,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt
    });
    this.orm.em.persist(orm);
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
