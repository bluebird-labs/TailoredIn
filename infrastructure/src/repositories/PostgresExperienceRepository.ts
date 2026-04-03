import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  BulletId,
  Bullet as DomainBullet,
  Experience as DomainExperience,
  ExperienceId,
  type ExperienceRepository,
  TagDimension,
  TagSet
} from '@tailoredin/domain';
import { Bullet as OrmBullet } from '../db/entities/experience/Bullet.js';
import { Experience as OrmExperience } from '../db/entities/experience/Experience.js';
import { Profile } from '../db/entities/profile/Profile.js';
import { Tag as OrmTag } from '../db/entities/tag/Tag.js';

type TagRow = { id: string; name: string; dimension: string };

@injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainExperience> {
    const orm = await this.orm.em.findOneOrFail(OrmExperience, id);
    return this.toDomain(orm);
  }

  public async findAll(): Promise<DomainExperience[]> {
    const ormEntities = await this.orm.em.find(OrmExperience, {}, { orderBy: { ordinal: 'ASC' } });
    return Promise.all(ormEntities.map(e => this.toDomain(e)));
  }

  public async save(experience: DomainExperience): Promise<void> {
    const existing = await this.orm.em.findOne(OrmExperience, experience.id.value);

    if (existing) {
      existing.title = experience.title;
      existing.companyName = experience.companyName;
      existing.companyWebsite = experience.companyWebsite;
      existing.location = experience.location;
      existing.startDate = experience.startDate;
      existing.endDate = experience.endDate;
      existing.summary = experience.summary;
      existing.narrative = experience.narrative;
      existing.ordinal = experience.ordinal;
      existing.updatedAt = experience.updatedAt;
      this.orm.em.persist(existing);
      await this.syncBullets(experience);
    } else {
      const profile = await this.orm.em.findOneOrFail(Profile, experience.profileId);
      const orm = new OrmExperience({
        id: experience.id.value,
        profile,
        title: experience.title,
        companyName: experience.companyName,
        companyWebsite: experience.companyWebsite,
        location: experience.location,
        startDate: experience.startDate,
        endDate: experience.endDate,
        summary: experience.summary,
        narrative: experience.narrative,
        ordinal: experience.ordinal,
        createdAt: experience.createdAt,
        updatedAt: experience.updatedAt
      });
      this.orm.em.persist(orm);

      for (const bullet of experience.bullets) {
        await this.persistNewBullet(bullet, orm);
      }
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmExperience, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private async syncBullets(domain: DomainExperience): Promise<void> {
    const existingBullets = await this.orm.em.find(OrmBullet, { experience: domain.id.value });
    const domainBulletIds = new Set(domain.bullets.map(b => b.id.value));
    const existingBulletIds = new Set(existingBullets.map(b => b.id));

    // Remove deleted bullets
    for (const existing of existingBullets) {
      if (!domainBulletIds.has(existing.id)) {
        this.orm.em.remove(existing);
      }
    }

    for (const bullet of domain.bullets) {
      if (existingBulletIds.has(bullet.id.value)) {
        // Update existing bullet
        const ormBullet = existingBullets.find(b => b.id === bullet.id.value)!;
        ormBullet.content = bullet.content;
        ormBullet.verboseDescription = bullet.verboseDescription;
        ormBullet.status = bullet.status;
        ormBullet.ordinal = bullet.ordinal;
        ormBullet.updatedAt = bullet.updatedAt;
        this.orm.em.persist(ormBullet);

        await this.syncBulletTags(bullet);
      } else {
        // Create new bullet
        const experienceRef = this.orm.em.getReference(OrmExperience, domain.id.value);
        await this.persistNewBullet(bullet, experienceRef);
      }
    }
  }

  private async persistNewBullet(bullet: DomainBullet, experience: OrmExperience): Promise<void> {
    const ormBullet = new OrmBullet({
      id: bullet.id.value,
      experience,
      content: bullet.content,
      verboseDescription: bullet.verboseDescription,
      status: bullet.status,
      ordinal: bullet.ordinal,
      createdAt: bullet.createdAt,
      updatedAt: bullet.updatedAt
    });
    this.orm.em.persist(ormBullet);

    await this.replaceBulletTags(bullet.id.value, bullet.tags);
  }

  private async syncBulletTags(bullet: DomainBullet): Promise<void> {
    await this.replaceBulletTags(bullet.id.value, bullet.tags);
  }

  private async replaceBulletTags(bulletId: string, tags: TagSet): Promise<void> {
    const conn = this.orm.em.getConnection();
    await conn.execute(`DELETE FROM bullet_tags WHERE bullet_id = '${bulletId}'`);

    const allTagNames = [...tags.roleTags, ...tags.skillTags];
    if (allTagNames.length === 0) return;

    for (const tagName of tags.roleTags) {
      const tag = await this.orm.em.findOne(OrmTag, { name: tagName, dimension: 'ROLE' });
      if (tag) {
        await conn.execute(`INSERT INTO bullet_tags (bullet_id, tag_id) VALUES ('${bulletId}', '${tag.id}')`);
      }
    }
    for (const tagName of tags.skillTags) {
      const tag = await this.orm.em.findOne(OrmTag, { name: tagName, dimension: 'SKILL' });
      if (tag) {
        await conn.execute(`INSERT INTO bullet_tags (bullet_id, tag_id) VALUES ('${bulletId}', '${tag.id}')`);
      }
    }
  }

  private async toDomain(orm: OrmExperience): Promise<DomainExperience> {
    // Extract profile_id via raw SQL to avoid MikroORM proxy issues
    const [row] = await this.orm.em
      .getConnection()
      .execute<[{ profile_id: string }]>(`SELECT profile_id FROM experiences WHERE id = '${orm.id}'`);
    const profileId = row.profile_id;

    // Load bullets
    const ormBullets = await this.orm.em.find(OrmBullet, { experience: orm.id }, { orderBy: { ordinal: 'ASC' } });

    const bullets: DomainBullet[] = [];
    for (const ormBullet of ormBullets) {
      const bulletTags = await this.loadBulletTags(ormBullet.id);

      bullets.push(
        new DomainBullet({
          id: new BulletId(ormBullet.id),
          experienceId: orm.id,
          content: ormBullet.content,
          verboseDescription: ormBullet.verboseDescription,
          status: (ormBullet.status ?? 'active') as import('@tailoredin/domain').BulletStatus,
          ordinal: ormBullet.ordinal,
          tags: bulletTags,
          createdAt: ormBullet.createdAt,
          updatedAt: ormBullet.updatedAt
        })
      );
    }

    return new DomainExperience({
      id: new ExperienceId(orm.id),
      profileId,
      title: orm.title,
      companyName: orm.companyName,
      companyWebsite: orm.companyWebsite,
      location: orm.location,
      startDate: orm.startDate,
      endDate: orm.endDate,
      summary: orm.summary,
      narrative: orm.narrative,
      ordinal: orm.ordinal,
      bullets,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }

  private async loadBulletTags(bulletId: string): Promise<TagSet> {
    const rows = await this.orm.em
      .getConnection()
      .execute<TagRow[]>(
        `SELECT t.id, t.name, t.dimension FROM tags t JOIN bullet_tags bt ON bt.tag_id = t.id WHERE bt.bullet_id = '${bulletId}'`
      );
    return this.rowsToTagSet(rows);
  }

  private rowsToTagSet(rows: TagRow[]): TagSet {
    const roleTags: string[] = [];
    const skillTags: string[] = [];
    for (const row of rows) {
      if (row.dimension === TagDimension.ROLE) {
        roleTags.push(row.name);
      } else if (row.dimension === TagDimension.SKILL) {
        skillTags.push(row.name);
      }
    }
    return new TagSet({ roleTags, skillTags });
  }
}
