import type { MikroORM } from '@mikro-orm/postgresql';
import { injectable } from '@needle-di/core';
import {
  ResumeBullet as DomainResumeBullet,
  ResumeCompany as DomainResumeCompany,
  ResumeBulletId,
  ResumeCompanyId,
  type ResumeCompanyRepository,
  ResumeLocation
} from '@tailoredin/domain';
import { ResumeBullet as OrmResumeBullet } from '../db/entities/resume/ResumeBullet.js';
import { ResumeCompany as OrmResumeCompany } from '../db/entities/resume/ResumeCompany.js';
import { ResumeCompanyLocation as OrmResumeCompanyLocation } from '../db/entities/resume/ResumeCompanyLocation.js';
import { User as OrmUser } from '../db/entities/users/User.js';

@injectable()
export class PostgresResumeCompanyRepository implements ResumeCompanyRepository {
  public constructor(private readonly orm: MikroORM) {}

  public async findByIdOrFail(id: string): Promise<DomainResumeCompany> {
    const orm = await this.orm.em.findOneOrFail(OrmResumeCompany, id, { populate: ['user'] });
    return this.toDomain(orm);
  }

  public async findAllByUserId(userId: string): Promise<DomainResumeCompany[]> {
    const ormCompanies = await this.orm.em.find(OrmResumeCompany, { user: userId });
    return Promise.all(ormCompanies.map(c => this.toDomain(c, userId)));
  }

  public async save(company: DomainResumeCompany): Promise<void> {
    const existing = await this.orm.em.findOne(OrmResumeCompany, company.id.value);

    if (existing) {
      this.updateCompany(existing, company);
      await this.syncBullets(company);
      await this.syncLocations(existing, company);
    } else {
      const userRef = this.orm.em.getReference(OrmUser, company.userId);
      const orm = new OrmResumeCompany({
        id: company.id.value,
        user: userRef,
        companyName: company.companyName,
        companyMention: company.companyMention,
        websiteUrl: company.websiteUrl,
        businessDomain: company.businessDomain,
        joinedAt: company.joinedAt,
        leftAt: company.leftAt,
        promotedAt: company.promotedAt,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      });
      this.orm.em.persist(orm);

      for (const bullet of company.bullets) {
        const ormBullet = new OrmResumeBullet({
          id: bullet.id.value,
          resumeCompany: orm,
          content: bullet.content,
          ordinal: bullet.ordinal,
          createdAt: bullet.createdAt,
          updatedAt: bullet.updatedAt
        });
        this.orm.em.persist(ormBullet);
      }

      for (const loc of company.locations) {
        const ormLoc = new OrmResumeCompanyLocation({
          id: crypto.randomUUID(),
          resumeCompany: orm,
          locationLabel: loc.label,
          ordinal: loc.ordinal,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt
        });
        this.orm.em.persist(ormLoc);
      }
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmResumeCompany, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private updateCompany(orm: OrmResumeCompany, domain: DomainResumeCompany): void {
    orm.companyName = domain.companyName;
    orm.companyMention = domain.companyMention;
    orm.websiteUrl = domain.websiteUrl;
    orm.businessDomain = domain.businessDomain;
    orm.joinedAt = domain.joinedAt;
    orm.leftAt = domain.leftAt;
    orm.promotedAt = domain.promotedAt;
    orm.updatedAt = domain.updatedAt;
    this.orm.em.persist(orm);
  }

  private async syncBullets(domain: DomainResumeCompany): Promise<void> {
    const existingBullets = await this.orm.em.find(OrmResumeBullet, { resumeCompany: domain.id.value });
    const domainBulletIds = new Set(domain.bullets.map(b => b.id.value));
    const existingBulletIds = new Set(existingBullets.map(b => b.id));

    for (const existing of existingBullets) {
      if (!domainBulletIds.has(existing.id)) {
        this.orm.em.remove(existing);
      }
    }

    for (const bullet of domain.bullets) {
      if (existingBulletIds.has(bullet.id.value)) {
        const ormBullet = existingBullets.find(b => b.id === bullet.id.value)!;
        ormBullet.content = bullet.content;
        ormBullet.ordinal = bullet.ordinal;
        ormBullet.updatedAt = bullet.updatedAt;
        this.orm.em.persist(ormBullet);
      } else {
        const companyRef = this.orm.em.getReference(OrmResumeCompany, domain.id.value);
        const ormBullet = new OrmResumeBullet({
          id: bullet.id.value,
          resumeCompany: companyRef,
          content: bullet.content,
          ordinal: bullet.ordinal,
          createdAt: bullet.createdAt,
          updatedAt: bullet.updatedAt
        });
        this.orm.em.persist(ormBullet);
      }
    }
  }

  private async syncLocations(orm: OrmResumeCompany, domain: DomainResumeCompany): Promise<void> {
    const existingLocations = await this.orm.em.find(OrmResumeCompanyLocation, { resumeCompany: orm.id });

    for (const existing of existingLocations) {
      this.orm.em.remove(existing);
    }

    for (const loc of domain.locations) {
      const ormLoc = new OrmResumeCompanyLocation({
        id: crypto.randomUUID(),
        resumeCompany: orm,
        locationLabel: loc.label,
        ordinal: loc.ordinal,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt
      });
      this.orm.em.persist(ormLoc);
    }
  }

  private async toDomain(orm: OrmResumeCompany, userId?: string): Promise<DomainResumeCompany> {
    const ormBullets = await this.orm.em.find(
      OrmResumeBullet,
      { resumeCompany: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );
    const ormLocations = await this.orm.em.find(
      OrmResumeCompanyLocation,
      { resumeCompany: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );

    const bullets = ormBullets.map(
      b =>
        new DomainResumeBullet({
          id: new ResumeBulletId(b.id),
          resumeCompanyId: orm.id,
          content: b.content,
          ordinal: b.ordinal,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt
        })
    );

    const locations = ormLocations.map(l => new ResumeLocation(l.locationLabel, l.ordinal));

    const resolvedUserId = userId ?? (typeof orm.user === 'string' ? orm.user : (orm.user as { id: string }).id);

    return new DomainResumeCompany({
      id: new ResumeCompanyId(orm.id),
      userId: resolvedUserId,
      companyName: orm.companyName,
      companyMention: orm.companyMention,
      websiteUrl: orm.websiteUrl,
      businessDomain: orm.businessDomain,
      joinedAt: orm.joinedAt,
      leftAt: orm.leftAt,
      promotedAt: orm.promotedAt,
      locations,
      bullets,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
