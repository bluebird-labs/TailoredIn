import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  SkillCategory as DomainSkillCategory,
  SkillItem as DomainSkillItem,
  SkillCategoryId,
  type SkillCategoryRepository,
  SkillItemId
} from '@tailoredin/domain';
import { Profile } from '../db/entities/profile/Profile.js';
import { SkillCategory as OrmSkillCategory } from '../db/entities/skills/SkillCategory.js';
import { SkillItem as OrmSkillItem } from '../db/entities/skills/SkillItem.js';

@injectable()
export class PostgresSkillCategoryRepository implements SkillCategoryRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainSkillCategory> {
    const orm = await this.orm.em.findOneOrFail(OrmSkillCategory, id, { populate: ['profile'] });
    return this.toDomain(orm);
  }

  public async findByItemIdOrFail(itemId: string): Promise<DomainSkillCategory> {
    const ormItem = await this.orm.em.findOneOrFail(OrmSkillItem, itemId, { populate: ['category'] });
    const [row] = await this.orm.em
      .getConnection()
      .execute<[{ skill_category_id: string }]>(`SELECT skill_category_id FROM skill_items WHERE id = '${itemId}'`);
    const categoryId = row.skill_category_id;
    return this.findByIdOrFail(categoryId);
  }

  public async findAll(): Promise<DomainSkillCategory[]> {
    const ormCategories = await this.orm.em.find(OrmSkillCategory, {}, { orderBy: { ordinal: 'ASC' } });
    return Promise.all(ormCategories.map(c => this.toDomain(c)));
  }

  public async save(category: DomainSkillCategory): Promise<void> {
    const existing = await this.orm.em.findOne(OrmSkillCategory, category.id.value);

    if (existing) {
      existing.name = category.name;
      existing.ordinal = category.ordinal;
      existing.updatedAt = category.updatedAt;
      this.orm.em.persist(existing);
      await this.syncItems(category);
    } else {
      const profileRef = this.orm.em.getReference(Profile, category.profileId);
      const orm = new OrmSkillCategory({
        id: category.id.value,
        profile: profileRef,
        name: category.name,
        ordinal: category.ordinal,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      });
      this.orm.em.persist(orm);

      for (const item of category.items) {
        const ormItem = new OrmSkillItem({
          id: item.id.value,
          category: orm,
          name: item.name,
          ordinal: item.ordinal,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        });
        this.orm.em.persist(ormItem);
      }
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmSkillCategory, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private async syncItems(domain: DomainSkillCategory): Promise<void> {
    const existingItems = await this.orm.em.find(OrmSkillItem, { category: domain.id.value });
    const domainItemIds = new Set(domain.items.map(i => i.id.value));
    const existingItemIds = new Set(existingItems.map(i => i.id));

    for (const existing of existingItems) {
      if (!domainItemIds.has(existing.id)) {
        this.orm.em.remove(existing);
      }
    }

    for (const item of domain.items) {
      if (existingItemIds.has(item.id.value)) {
        const ormItem = existingItems.find(i => i.id === item.id.value)!;
        ormItem.name = item.name;
        ormItem.ordinal = item.ordinal;
        ormItem.updatedAt = item.updatedAt;
        this.orm.em.persist(ormItem);
      } else {
        const categoryRef = this.orm.em.getReference(OrmSkillCategory, domain.id.value);
        const ormItem = new OrmSkillItem({
          id: item.id.value,
          category: categoryRef,
          name: item.name,
          ordinal: item.ordinal,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        });
        this.orm.em.persist(ormItem);
      }
    }
  }

  private async toDomain(orm: OrmSkillCategory): Promise<DomainSkillCategory> {
    // Extract profile_id from the raw FK column — avoids MikroORM Reference/proxy issues
    const [row] = await this.orm.em
      .getConnection()
      .execute<[{ profile_id: string }]>(`SELECT profile_id FROM skill_categories WHERE id = '${orm.id}'`);
    const profileId = row.profile_id;

    const ormItems = await this.orm.em.find(OrmSkillItem, { category: orm.id }, { orderBy: { ordinal: 'ASC' } });

    const items = ormItems.map(
      i =>
        new DomainSkillItem({
          id: new SkillItemId(i.id),
          categoryId: orm.id,
          name: i.name,
          ordinal: i.ordinal,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt
        })
    );

    return new DomainSkillCategory({
      id: new SkillCategoryId(orm.id),
      profileId,
      name: orm.name,
      ordinal: orm.ordinal,
      items,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
