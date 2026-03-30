import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  ResumeSkillCategory as DomainResumeSkillCategory,
  ResumeSkillItem as DomainResumeSkillItem,
  ResumeSkillCategoryId,
  type ResumeSkillCategoryRepository,
  ResumeSkillItemId
} from '@tailoredin/domain';
import { ResumeSkillCategory as OrmResumeSkillCategory } from '../db/entities/resume/ResumeSkillCategory.js';
import { ResumeSkillItem as OrmResumeSkillItem } from '../db/entities/resume/ResumeSkillItem.js';
import { User as OrmUser } from '../db/entities/users/User.js';

@injectable()
export class PostgresResumeSkillCategoryRepository implements ResumeSkillCategoryRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainResumeSkillCategory> {
    const orm = await this.orm.em.findOneOrFail(OrmResumeSkillCategory, id, { populate: ['user'] });
    return this.toDomain(orm);
  }

  public async findAllByUserId(userId: string): Promise<DomainResumeSkillCategory[]> {
    const ormCategories = await this.orm.em.find(
      OrmResumeSkillCategory,
      { user: userId },
      { orderBy: { ordinal: 'ASC' } }
    );
    return Promise.all(ormCategories.map(c => this.toDomain(c, userId)));
  }

  public async save(category: DomainResumeSkillCategory): Promise<void> {
    const existing = await this.orm.em.findOne(OrmResumeSkillCategory, category.id.value);

    if (existing) {
      existing.categoryName = category.categoryName;
      existing.ordinal = category.ordinal;
      existing.updatedAt = category.updatedAt;
      this.orm.em.persist(existing);
      await this.syncItems(category);
    } else {
      const userRef = this.orm.em.getReference(OrmUser, category.userId);
      const orm = new OrmResumeSkillCategory({
        id: category.id.value,
        user: userRef,
        categoryName: category.categoryName,
        ordinal: category.ordinal,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      });
      this.orm.em.persist(orm);

      for (const item of category.items) {
        const ormItem = new OrmResumeSkillItem({
          id: item.id.value,
          category: orm,
          skillName: item.skillName,
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
    const orm = await this.orm.em.findOneOrFail(OrmResumeSkillCategory, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private async syncItems(domain: DomainResumeSkillCategory): Promise<void> {
    const existingItems = await this.orm.em.find(OrmResumeSkillItem, { category: domain.id.value });
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
        ormItem.skillName = item.skillName;
        ormItem.ordinal = item.ordinal;
        ormItem.updatedAt = item.updatedAt;
        this.orm.em.persist(ormItem);
      } else {
        const categoryRef = this.orm.em.getReference(OrmResumeSkillCategory, domain.id.value);
        const ormItem = new OrmResumeSkillItem({
          id: item.id.value,
          category: categoryRef,
          skillName: item.skillName,
          ordinal: item.ordinal,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        });
        this.orm.em.persist(ormItem);
      }
    }
  }

  private async toDomain(orm: OrmResumeSkillCategory, userId?: string): Promise<DomainResumeSkillCategory> {
    const resolvedUserId = userId ?? (typeof orm.user === 'string' ? orm.user : (orm.user as { id: string }).id);

    const ormItems = await this.orm.em.find(OrmResumeSkillItem, { category: orm.id }, { orderBy: { ordinal: 'ASC' } });

    const items = ormItems.map(
      i =>
        new DomainResumeSkillItem({
          id: new ResumeSkillItemId(i.id),
          categoryId: orm.id,
          skillName: i.skillName,
          ordinal: i.ordinal,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt
        })
    );

    return new DomainResumeSkillCategory({
      id: new ResumeSkillCategoryId(orm.id),
      userId: resolvedUserId,
      categoryName: orm.categoryName,
      ordinal: orm.ordinal,
      items,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
