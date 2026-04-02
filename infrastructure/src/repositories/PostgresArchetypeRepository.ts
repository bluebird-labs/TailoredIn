import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  ArchetypeId,
  type ArchetypeRepository,
  ContentSelection,
  Archetype as DomainArchetype,
  type TagDimension,
  TagProfile
} from '@tailoredin/domain';
import { ArchetypeOrm } from '../db/entities/archetypes/ArchetypeOrm.js';
import { ArchetypeTagWeight } from '../db/entities/archetypes/ArchetypeTagWeight.js';
import { Tag as OrmTag } from '../db/entities/tag/Tag.js';

@injectable()
export class PostgresArchetypeRepository implements ArchetypeRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainArchetype> {
    const orm = await this.orm.em.findOneOrFail(ArchetypeOrm, id);
    return this.toDomain(orm);
  }

  public async findAll(): Promise<DomainArchetype[]> {
    const ormEntities = await this.orm.em.find(ArchetypeOrm, {}, { orderBy: { createdAt: 'ASC' } });
    return Promise.all(ormEntities.map(e => this.toDomain(e)));
  }

  public async save(archetype: DomainArchetype): Promise<void> {
    const existing = await this.orm.em.findOne(ArchetypeOrm, archetype.id.value);
    const contentJson = this.serializeContentSelection(archetype.contentSelection);

    if (existing) {
      existing.key = archetype.key;
      existing.label = archetype.label;
      existing.headlineId = archetype.headlineId;
      existing.headlineText = archetype.headlineText;
      existing.contentSelection = contentJson;
      existing.updatedAt = archetype.updatedAt;
      this.orm.em.persist(existing);
    } else {
      const orm = new ArchetypeOrm({
        id: archetype.id.value,
        profileId: archetype.profileId,
        key: archetype.key,
        label: archetype.label,
        headlineId: archetype.headlineId,
        headlineText: archetype.headlineText,
        contentSelection: contentJson,
        createdAt: archetype.createdAt,
        updatedAt: archetype.updatedAt
      });
      this.orm.em.persist(orm);
    }

    // Sync tag weights: delete all, re-insert
    await this.replaceTagWeights(archetype);
    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(ArchetypeOrm, id);
    // Tag weights cascade-delete via FK
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private async replaceTagWeights(archetype: DomainArchetype): Promise<void> {
    const conn = this.orm.em.getConnection();
    await conn.execute(`DELETE FROM archetype_tag_weights WHERE archetype_id = '${archetype.id.value}'`);

    for (const [tagId, weight] of archetype.tagProfile.roleWeights) {
      const id = crypto.randomUUID();
      await conn.execute(
        `INSERT INTO archetype_tag_weights (id, archetype_id, tag_id, weight) VALUES ('${id}', '${archetype.id.value}', '${tagId}', ${weight})`
      );
    }
    for (const [tagId, weight] of archetype.tagProfile.skillWeights) {
      const id = crypto.randomUUID();
      await conn.execute(
        `INSERT INTO archetype_tag_weights (id, archetype_id, tag_id, weight) VALUES ('${id}', '${archetype.id.value}', '${tagId}', ${weight})`
      );
    }
  }

  private async toDomain(orm: ArchetypeOrm): Promise<DomainArchetype> {
    // Load tag weights + their dimensions
    const weights = await this.orm.em.find(ArchetypeTagWeight, { archetypeId: orm.id });
    const tagIds = weights.map(w => w.tagId);
    // biome-ignore lint/style/useNamingConvention: MikroORM operator
    const tags = tagIds.length > 0 ? await this.orm.em.find(OrmTag, { id: { $in: tagIds } }) : [];
    const tagDimensionMap = new Map(tags.map(t => [t.id, t.dimension as TagDimension]));

    const roleWeights = new Map<string, number>();
    const skillWeights = new Map<string, number>();
    for (const w of weights) {
      const dimension = tagDimensionMap.get(w.tagId);
      if (dimension === 'ROLE') roleWeights.set(w.tagId, w.weight);
      else if (dimension === 'SKILL') skillWeights.set(w.tagId, w.weight);
    }

    // Deserialize content selection
    const cs = orm.contentSelection as Record<string, unknown>;
    const contentSelection = new ContentSelection({
      experienceSelections: (cs.experienceSelections as { experienceId: string; bulletVariantIds: string[] }[]) ?? [],
      projectIds: (cs.projectIds as string[]) ?? [],
      educationIds: (cs.educationIds as string[]) ?? [],
      skillCategoryIds: (cs.skillCategoryIds as string[]) ?? [],
      skillItemIds: (cs.skillItemIds as string[]) ?? []
    });

    return new DomainArchetype({
      id: new ArchetypeId(orm.id),
      profileId: orm.profileId,
      key: orm.key,
      label: orm.label,
      headlineId: orm.headlineId,
      headlineText: orm.headlineText,
      tagProfile: new TagProfile({ roleWeights, skillWeights }),
      contentSelection,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }

  private serializeContentSelection(cs: ContentSelection): Record<string, unknown> {
    return {
      experienceSelections: cs.experienceSelections,
      projectIds: cs.projectIds,
      educationIds: cs.educationIds,
      skillCategoryIds: cs.skillCategoryIds,
      skillItemIds: cs.skillItemIds
    };
  }
}
