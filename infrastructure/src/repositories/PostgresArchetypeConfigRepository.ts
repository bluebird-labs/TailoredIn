import type { MikroORM } from '@mikro-orm/postgresql';
import { injectable } from '@needle-di/core';
import {
  type Archetype,
  ArchetypeConfig,
  ArchetypeConfigId,
  type ArchetypeConfigRepository,
  ArchetypeEducationSelection,
  ArchetypePositionBulletRef,
  ArchetypePositionId,
  ArchetypeSkillCategorySelection,
  ArchetypeSkillItemSelection,
  ArchetypePosition as DomainArchetypePosition
} from '@tailoredin/domain';
import { Archetype as OrmArchetype } from '../db/entities/archetypes/Archetype.js';
import { ArchetypeEducation as OrmArchetypeEducation } from '../db/entities/archetypes/ArchetypeEducation.js';
import { ArchetypePosition as OrmArchetypePosition } from '../db/entities/archetypes/ArchetypePosition.js';
import { ArchetypePositionBullet as OrmArchetypePositionBullet } from '../db/entities/archetypes/ArchetypePositionBullet.js';
import { ArchetypeSkillCategory as OrmArchetypeSkillCategory } from '../db/entities/archetypes/ArchetypeSkillCategory.js';
import { ArchetypeSkillItem as OrmArchetypeSkillItem } from '../db/entities/archetypes/ArchetypeSkillItem.js';
import { ResumeBullet as OrmResumeBullet } from '../db/entities/resume/ResumeBullet.js';
import { ResumeCompany as OrmResumeCompany } from '../db/entities/resume/ResumeCompany.js';
import { ResumeEducation as OrmResumeEducation } from '../db/entities/resume/ResumeEducation.js';
import { ResumeHeadline as OrmResumeHeadline } from '../db/entities/resume/ResumeHeadline.js';
import { ResumeSkillCategory as OrmResumeSkillCategory } from '../db/entities/resume/ResumeSkillCategory.js';
import { ResumeSkillItem as OrmResumeSkillItem } from '../db/entities/resume/ResumeSkillItem.js';
import { User as OrmUser } from '../db/entities/users/User.js';

@injectable()
export class PostgresArchetypeConfigRepository implements ArchetypeConfigRepository {
  public constructor(private readonly orm: MikroORM) {}

  public async findByIdOrFail(id: string): Promise<ArchetypeConfig> {
    const orm = await this.orm.em.findOneOrFail(OrmArchetype, id);
    return this.toDomain(orm);
  }

  public async findByUserAndKey(userId: string, key: Archetype): Promise<ArchetypeConfig | null> {
    const orm = await this.orm.em.findOne(OrmArchetype, { user: userId, archetypeKey: key });
    if (!orm) return null;
    return this.toDomain(orm, userId);
  }

  public async findAllByUserId(userId: string): Promise<ArchetypeConfig[]> {
    const ormArchetypes = await this.orm.em.find(OrmArchetype, { user: userId });
    return Promise.all(ormArchetypes.map(a => this.toDomain(a, userId)));
  }

  public async save(config: ArchetypeConfig): Promise<void> {
    const existing = await this.orm.em.findOne(OrmArchetype, config.id.value);

    if (existing) {
      existing.archetypeKey = config.archetypeKey;
      existing.archetypeLabel = config.archetypeLabel;
      existing.archetypeDescription = config.archetypeDescription;
      existing.socialNetworks = config.socialNetworks;
      existing.updatedAt = config.updatedAt;
      this.orm.em.persist(existing);

      await this.syncPositions(config);
      await this.syncEducation(config);
      await this.syncSkillCategories(config);
      await this.syncSkillItems(config);
    } else {
      const userRef = this.orm.em.getReference(OrmUser, config.userId);
      const headlineRef = this.orm.em.getReference(OrmResumeHeadline, config.headlineId);
      const orm = new OrmArchetype({
        id: config.id.value,
        user: userRef,
        archetypeKey: config.archetypeKey,
        archetypeLabel: config.archetypeLabel,
        archetypeDescription: config.archetypeDescription,
        headline: headlineRef,
        socialNetworks: config.socialNetworks,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      });
      this.orm.em.persist(orm);

      for (const position of config.positions) {
        this.persistPosition(orm, position);
      }

      this.persistEducationSelections(orm, config.educationSelections);
      this.persistSkillCategorySelections(orm, config.skillCategorySelections);
      this.persistSkillItemSelections(orm, config.skillItemSelections);
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmArchetype, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private persistPosition(ormArchetype: OrmArchetype, position: DomainArchetypePosition): void {
    const companyRef = this.orm.em.getReference(OrmResumeCompany, position.resumeCompanyId);
    const ormPosition = OrmArchetypePosition.create({
      archetype: ormArchetype,
      resumeCompany: companyRef,
      jobTitle: position.jobTitle,
      displayCompanyName: position.displayCompanyName,
      locationLabel: position.locationLabel,
      startDate: position.startDate,
      endDate: position.endDate,
      roleSummary: position.roleSummary,
      ordinal: position.ordinal
    });
    this.orm.em.persist(ormPosition);

    for (const bulletRef of position.bullets) {
      const bulletEntity = this.orm.em.getReference(OrmResumeBullet, bulletRef.bulletId);
      const ormBullet = OrmArchetypePositionBullet.create({
        position: ormPosition,
        bullet: bulletEntity,
        ordinal: bulletRef.ordinal
      });
      this.orm.em.persist(ormBullet);
    }
  }

  private async syncPositions(config: ArchetypeConfig): Promise<void> {
    const existingPositions = await this.orm.em.find(OrmArchetypePosition, { archetype: config.id.value });
    for (const existing of existingPositions) {
      const existingBullets = await this.orm.em.find(OrmArchetypePositionBullet, { position: existing.id });
      for (const bullet of existingBullets) {
        this.orm.em.remove(bullet);
      }
      this.orm.em.remove(existing);
    }

    const archetypeRef = this.orm.em.getReference(OrmArchetype, config.id.value);
    for (const position of config.positions) {
      this.persistPosition(archetypeRef, position);
    }
  }

  private async syncEducation(config: ArchetypeConfig): Promise<void> {
    const existing = await this.orm.em.find(OrmArchetypeEducation, { archetype: config.id.value });
    for (const e of existing) {
      this.orm.em.remove(e);
    }

    const archetypeRef = this.orm.em.getReference(OrmArchetype, config.id.value);
    this.persistEducationSelections(archetypeRef, config.educationSelections);
  }

  private async syncSkillCategories(config: ArchetypeConfig): Promise<void> {
    const existing = await this.orm.em.find(OrmArchetypeSkillCategory, { archetype: config.id.value });
    for (const e of existing) {
      this.orm.em.remove(e);
    }

    const archetypeRef = this.orm.em.getReference(OrmArchetype, config.id.value);
    this.persistSkillCategorySelections(archetypeRef, config.skillCategorySelections);
  }

  private async syncSkillItems(config: ArchetypeConfig): Promise<void> {
    const existing = await this.orm.em.find(OrmArchetypeSkillItem, { archetype: config.id.value });
    for (const e of existing) {
      this.orm.em.remove(e);
    }

    const archetypeRef = this.orm.em.getReference(OrmArchetype, config.id.value);
    this.persistSkillItemSelections(archetypeRef, config.skillItemSelections);
  }

  private persistEducationSelections(
    archetypeRef: OrmArchetype,
    selections: readonly ArchetypeEducationSelection[]
  ): void {
    for (const sel of selections) {
      const educationRef = this.orm.em.getReference(OrmResumeEducation, sel.educationId);
      const orm = OrmArchetypeEducation.create({
        archetype: archetypeRef,
        education: educationRef,
        ordinal: sel.ordinal
      });
      this.orm.em.persist(orm);
    }
  }

  private persistSkillCategorySelections(
    archetypeRef: OrmArchetype,
    selections: readonly ArchetypeSkillCategorySelection[]
  ): void {
    for (const sel of selections) {
      const categoryRef = this.orm.em.getReference(OrmResumeSkillCategory, sel.categoryId);
      const orm = OrmArchetypeSkillCategory.create({
        archetype: archetypeRef,
        category: categoryRef,
        ordinal: sel.ordinal
      });
      this.orm.em.persist(orm);
    }
  }

  private persistSkillItemSelections(
    archetypeRef: OrmArchetype,
    selections: readonly ArchetypeSkillItemSelection[]
  ): void {
    for (const sel of selections) {
      const itemRef = this.orm.em.getReference(OrmResumeSkillItem, sel.itemId);
      const orm = OrmArchetypeSkillItem.create({
        archetype: archetypeRef,
        item: itemRef,
        ordinal: sel.ordinal
      });
      this.orm.em.persist(orm);
    }
  }

  private async toDomain(orm: OrmArchetype, userId?: string): Promise<ArchetypeConfig> {
    const resolvedUserId = userId ?? (typeof orm.user === 'string' ? orm.user : (orm.user as { id: string }).id);
    const resolvedHeadlineId = typeof orm.headline === 'string' ? orm.headline : (orm.headline as { id: string }).id;

    const ormPositions = await this.orm.em.find(
      OrmArchetypePosition,
      { archetype: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );

    const positions: DomainArchetypePosition[] = [];
    for (const ormPos of ormPositions) {
      const ormBullets = await this.orm.em.find(
        OrmArchetypePositionBullet,
        { position: ormPos.id },
        { orderBy: { ordinal: 'ASC' } }
      );

      const bulletRefs = ormBullets.map(b => {
        const bulletId = typeof b.bullet === 'string' ? b.bullet : (b.bullet as { id: string }).id;
        return new ArchetypePositionBulletRef(bulletId, b.ordinal);
      });

      const resumeCompanyId =
        typeof ormPos.resumeCompany === 'string' ? ormPos.resumeCompany : (ormPos.resumeCompany as { id: string }).id;

      positions.push(
        new DomainArchetypePosition({
          id: new ArchetypePositionId(ormPos.id),
          archetypeId: orm.id,
          resumeCompanyId,
          jobTitle: ormPos.jobTitle,
          displayCompanyName: ormPos.displayCompanyName,
          locationLabel: ormPos.locationLabel,
          startDate: ormPos.startDate,
          endDate: ormPos.endDate,
          roleSummary: ormPos.roleSummary,
          ordinal: ormPos.ordinal,
          bullets: bulletRefs,
          createdAt: ormPos.createdAt,
          updatedAt: ormPos.updatedAt
        })
      );
    }

    const ormEducation = await this.orm.em.find(
      OrmArchetypeEducation,
      { archetype: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );
    const educationSelections = ormEducation.map(e => {
      const educationId = typeof e.education === 'string' ? e.education : (e.education as { id: string }).id;
      return new ArchetypeEducationSelection(educationId, e.ordinal);
    });

    const ormSkillCategories = await this.orm.em.find(
      OrmArchetypeSkillCategory,
      { archetype: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );
    const skillCategorySelections = ormSkillCategories.map(sc => {
      const categoryId = typeof sc.category === 'string' ? sc.category : (sc.category as { id: string }).id;
      return new ArchetypeSkillCategorySelection(categoryId, sc.ordinal);
    });

    const ormSkillItems = await this.orm.em.find(
      OrmArchetypeSkillItem,
      { archetype: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );
    const skillItemSelections = ormSkillItems.map(si => {
      const itemId = typeof si.item === 'string' ? si.item : (si.item as { id: string }).id;
      return new ArchetypeSkillItemSelection(itemId, si.ordinal);
    });

    return new ArchetypeConfig({
      id: new ArchetypeConfigId(orm.id),
      userId: resolvedUserId,
      archetypeKey: orm.archetypeKey as Archetype,
      archetypeLabel: orm.archetypeLabel,
      archetypeDescription: orm.archetypeDescription,
      headlineId: resolvedHeadlineId,
      socialNetworks: orm.socialNetworks,
      positions,
      educationSelections,
      skillCategorySelections,
      skillItemSelections,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
