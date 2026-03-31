import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  ArchetypeConfigId,
  type ArchetypeConfigRepository,
  ArchetypeEducationSelection,
  type Archetype as ArchetypeEnum,
  ArchetypePositionBulletRef,
  ArchetypePositionId,
  ArchetypeSkillCategorySelection,
  ArchetypeSkillItemSelection,
  ArchetypeConfig as DomainArchetypeConfig,
  ArchetypePosition as DomainArchetypePosition
} from '@tailoredin/domain';
import { Archetype as OrmArchetype } from '../db/entities/archetypes/Archetype.js';
import { ArchetypeEducation as OrmArchetypeEducation } from '../db/entities/archetypes/ArchetypeEducation.js';
import { ArchetypePosition as OrmArchetypePosition } from '../db/entities/archetypes/ArchetypePosition.js';
import { ArchetypePositionBullet as OrmArchetypePositionBullet } from '../db/entities/archetypes/ArchetypePositionBullet.js';
import { ArchetypeSkillCategory as OrmArchetypeSkillCategory } from '../db/entities/archetypes/ArchetypeSkillCategory.js';
import { ArchetypeSkillItem as OrmArchetypeSkillItem } from '../db/entities/archetypes/ArchetypeSkillItem.js';
import { ResumeBullet as OrmResumeBullet } from '../db/entities/resume/ResumeBullet.js';
import { ResumeEducation as OrmResumeEducation } from '../db/entities/resume/ResumeEducation.js';
import { ResumeHeadline as OrmResumeHeadline } from '../db/entities/resume/ResumeHeadline.js';
import { ResumePosition as OrmResumePosition } from '../db/entities/resume/ResumePosition.js';
import { ResumeSkillCategory as OrmResumeSkillCategory } from '../db/entities/resume/ResumeSkillCategory.js';
import { ResumeSkillItem as OrmResumeSkillItem } from '../db/entities/resume/ResumeSkillItem.js';
import { User as OrmUser } from '../db/entities/users/User.js';

@injectable()
export class PostgresArchetypeConfigRepository implements ArchetypeConfigRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainArchetypeConfig> {
    const orm = await this.orm.em.findOneOrFail(OrmArchetype, id, { populate: ['user', 'headline'] });
    return this.toDomain(orm);
  }

  public async findByUserAndKey(userId: string, key: ArchetypeEnum): Promise<DomainArchetypeConfig | null> {
    const orm = await this.orm.em.findOne(
      OrmArchetype,
      { user: userId, archetypeKey: key },
      { populate: ['headline'] }
    );
    if (!orm) return null;
    return this.toDomain(orm, userId);
  }

  public async findAllByUserId(userId: string): Promise<DomainArchetypeConfig[]> {
    const ormArchetypes = await this.orm.em.find(OrmArchetype, { user: userId }, { populate: ['headline'] });
    return Promise.all(ormArchetypes.map(a => this.toDomain(a, userId)));
  }

  public async save(config: DomainArchetypeConfig): Promise<void> {
    const existing = await this.orm.em.findOne(OrmArchetype, config.id.value);

    if (existing) {
      existing.archetypeKey = config.archetypeKey;
      existing.archetypeLabel = config.archetypeLabel;
      existing.archetypeDescription = config.archetypeDescription;
      existing.socialNetworks = config.socialNetworks;
      existing.updatedAt = config.updatedAt;
      this.orm.em.persist(existing);

      await this.syncPositions(config);
      await this.syncEducationSelections(config);
      await this.syncSkillCategorySelections(config);
      await this.syncSkillItemSelections(config);
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

      this.persistPositions(config);
      this.persistEducationSelections(config);
      this.persistSkillCategorySelections(config);
      this.persistSkillItemSelections(config);
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    // Delete children first to avoid FK violations
    const positions = await this.orm.em.find(OrmArchetypePosition, { archetype: id });
    for (const pos of positions) {
      const bullets = await this.orm.em.find(OrmArchetypePositionBullet, { position: pos.id });
      for (const b of bullets) this.orm.em.remove(b);
      this.orm.em.remove(pos);
    }

    const education = await this.orm.em.find(OrmArchetypeEducation, { archetype: id });
    for (const e of education) this.orm.em.remove(e);

    const skillCategories = await this.orm.em.find(OrmArchetypeSkillCategory, { archetype: id });
    for (const sc of skillCategories) this.orm.em.remove(sc);

    const skillItems = await this.orm.em.find(OrmArchetypeSkillItem, { archetype: id });
    for (const si of skillItems) this.orm.em.remove(si);

    const orm = await this.orm.em.findOneOrFail(OrmArchetype, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private persistPositions(config: DomainArchetypeConfig): void {
    const archetypeRef = this.orm.em.getReference(OrmArchetype, config.id.value);
    for (const pos of config.positions) {
      const positionRef = this.orm.em.getReference(OrmResumePosition, pos.resumePositionId);
      const ormPos = new OrmArchetypePosition({
        id: pos.id.value,
        archetype: archetypeRef,
        resumePosition: positionRef,
        jobTitle: pos.jobTitle,
        displayCompanyName: pos.displayCompanyName,
        locationLabel: pos.locationLabel,
        startDate: pos.startDate,
        endDate: pos.endDate,
        roleSummary: pos.roleSummary,
        ordinal: pos.ordinal,
        createdAt: pos.createdAt,
        updatedAt: pos.updatedAt
      });
      this.orm.em.persist(ormPos);

      for (const bulletRef of pos.bullets) {
        const bulletOrmRef = this.orm.em.getReference(OrmResumeBullet, bulletRef.bulletId);
        const ormBullet = new OrmArchetypePositionBullet({
          id: crypto.randomUUID(),
          position: ormPos,
          bullet: bulletOrmRef,
          ordinal: bulletRef.ordinal,
          createdAt: pos.createdAt,
          updatedAt: pos.updatedAt
        });
        this.orm.em.persist(ormBullet);
      }
    }
  }

  private persistEducationSelections(config: DomainArchetypeConfig): void {
    const archetypeRef = this.orm.em.getReference(OrmArchetype, config.id.value);
    for (const sel of config.educationSelections) {
      const educationRef = this.orm.em.getReference(OrmResumeEducation, sel.educationId);
      const orm = new OrmArchetypeEducation({
        id: crypto.randomUUID(),
        archetype: archetypeRef,
        education: educationRef,
        ordinal: sel.ordinal,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      });
      this.orm.em.persist(orm);
    }
  }

  private persistSkillCategorySelections(config: DomainArchetypeConfig): void {
    const archetypeRef = this.orm.em.getReference(OrmArchetype, config.id.value);
    for (const sel of config.skillCategorySelections) {
      const categoryRef = this.orm.em.getReference(OrmResumeSkillCategory, sel.categoryId);
      const orm = new OrmArchetypeSkillCategory({
        id: crypto.randomUUID(),
        archetype: archetypeRef,
        category: categoryRef,
        ordinal: sel.ordinal,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      });
      this.orm.em.persist(orm);
    }
  }

  private persistSkillItemSelections(config: DomainArchetypeConfig): void {
    const archetypeRef = this.orm.em.getReference(OrmArchetype, config.id.value);
    for (const sel of config.skillItemSelections) {
      const itemRef = this.orm.em.getReference(OrmResumeSkillItem, sel.itemId);
      const orm = new OrmArchetypeSkillItem({
        id: crypto.randomUUID(),
        archetype: archetypeRef,
        item: itemRef,
        ordinal: sel.ordinal,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      });
      this.orm.em.persist(orm);
    }
  }

  private async syncPositions(config: DomainArchetypeConfig): Promise<void> {
    // Delete-and-recreate approach for positions
    const existingPositions = await this.orm.em.find(OrmArchetypePosition, { archetype: config.id.value });
    for (const pos of existingPositions) {
      const bullets = await this.orm.em.find(OrmArchetypePositionBullet, { position: pos.id });
      for (const b of bullets) this.orm.em.remove(b);
      this.orm.em.remove(pos);
    }
    this.persistPositions(config);
  }

  private async syncEducationSelections(config: DomainArchetypeConfig): Promise<void> {
    const existing = await this.orm.em.find(OrmArchetypeEducation, { archetype: config.id.value });
    for (const e of existing) this.orm.em.remove(e);
    this.persistEducationSelections(config);
  }

  private async syncSkillCategorySelections(config: DomainArchetypeConfig): Promise<void> {
    const existing = await this.orm.em.find(OrmArchetypeSkillCategory, { archetype: config.id.value });
    for (const sc of existing) this.orm.em.remove(sc);
    this.persistSkillCategorySelections(config);
  }

  private async syncSkillItemSelections(config: DomainArchetypeConfig): Promise<void> {
    const existing = await this.orm.em.find(OrmArchetypeSkillItem, { archetype: config.id.value });
    for (const si of existing) this.orm.em.remove(si);
    this.persistSkillItemSelections(config);
  }

  private async toDomain(orm: OrmArchetype, userId?: string): Promise<DomainArchetypeConfig> {
    const resolvedUserId = userId ?? (typeof orm.user === 'string' ? orm.user : (orm.user as { id: string }).id);
    const resolvedHeadlineId = typeof orm.headline === 'string' ? orm.headline : (orm.headline as { id: string }).id;

    // Load positions with their bullets
    const ormPositions = await this.orm.em.find(
      OrmArchetypePosition,
      { archetype: orm.id },
      { orderBy: { ordinal: 'ASC' }, populate: ['resumePosition'] }
    );

    const positions: DomainArchetypePosition[] = [];
    for (const pos of ormPositions) {
      const ormBullets = await this.orm.em.find(
        OrmArchetypePositionBullet,
        { position: pos.id },
        { orderBy: { ordinal: 'ASC' }, populate: ['bullet'] }
      );

      const resolvedPositionId =
        typeof pos.resumePosition === 'string' ? pos.resumePosition : (pos.resumePosition as { id: string }).id;

      positions.push(
        new DomainArchetypePosition({
          id: new ArchetypePositionId(pos.id),
          archetypeId: orm.id,
          resumePositionId: resolvedPositionId,
          jobTitle: pos.jobTitle,
          displayCompanyName: pos.displayCompanyName,
          locationLabel: pos.locationLabel,
          startDate: pos.startDate,
          endDate: pos.endDate,
          roleSummary: pos.roleSummary,
          ordinal: pos.ordinal,
          bullets: ormBullets.map(b => {
            const resolvedBulletId = typeof b.bullet === 'string' ? b.bullet : (b.bullet as { id: string }).id;
            return new ArchetypePositionBulletRef(resolvedBulletId, b.ordinal);
          }),
          createdAt: pos.createdAt,
          updatedAt: pos.updatedAt
        })
      );
    }

    // Load education selections
    const ormEducation = await this.orm.em.find(
      OrmArchetypeEducation,
      { archetype: orm.id },
      { orderBy: { ordinal: 'ASC' }, populate: ['education'] }
    );
    const educationSelections = ormEducation.map(e => {
      const resolvedEducationId = typeof e.education === 'string' ? e.education : (e.education as { id: string }).id;
      return new ArchetypeEducationSelection(resolvedEducationId, e.ordinal);
    });

    // Load skill category selections
    const ormSkillCategories = await this.orm.em.find(
      OrmArchetypeSkillCategory,
      { archetype: orm.id },
      { orderBy: { ordinal: 'ASC' }, populate: ['category'] }
    );
    const skillCategorySelections = ormSkillCategories.map(sc => {
      const resolvedCategoryId = typeof sc.category === 'string' ? sc.category : (sc.category as { id: string }).id;
      return new ArchetypeSkillCategorySelection(resolvedCategoryId, sc.ordinal);
    });

    // Load skill item selections
    const ormSkillItems = await this.orm.em.find(
      OrmArchetypeSkillItem,
      { archetype: orm.id },
      { orderBy: { ordinal: 'ASC' }, populate: ['item'] }
    );
    const skillItemSelections = ormSkillItems.map(si => {
      const resolvedItemId = typeof si.item === 'string' ? si.item : (si.item as { id: string }).id;
      return new ArchetypeSkillItemSelection(resolvedItemId, si.ordinal);
    });

    return new DomainArchetypeConfig({
      id: new ArchetypeConfigId(orm.id),
      userId: resolvedUserId,
      archetypeKey: orm.archetypeKey as ArchetypeEnum,
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
