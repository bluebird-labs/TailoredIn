import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  ResumeBullet as DomainResumeBullet,
  ResumeCompany as DomainResumeCompany,
  ResumePosition as DomainResumePosition,
  ResumeBulletId,
  ResumeCompanyId,
  type ResumeCompanyRepository,
  ResumeLocation,
  ResumePositionId
} from '@tailoredin/domain';
import { ResumeBullet as OrmResumeBullet } from '../db/entities/resume/ResumeBullet.js';
import { ResumeCompany as OrmResumeCompany } from '../db/entities/resume/ResumeCompany.js';
import { ResumeCompanyLocation as OrmResumeCompanyLocation } from '../db/entities/resume/ResumeCompanyLocation.js';
import { ResumePosition as OrmResumePosition } from '../db/entities/resume/ResumePosition.js';
import { User as OrmUser } from '../db/entities/users/User.js';

@injectable()
export class PostgresResumeCompanyRepository implements ResumeCompanyRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainResumeCompany> {
    const orm = await this.orm.em.findOneOrFail(OrmResumeCompany, id, { populate: ['user'] });
    return this.toDomain(orm);
  }

  public async findAllByUserId(userId: string): Promise<DomainResumeCompany[]> {
    const ormCompanies = await this.orm.em.find(OrmResumeCompany, { user: userId });
    return Promise.all(ormCompanies.map(c => this.toDomain(c, userId)));
  }

  public async findByPositionIdOrFail(positionId: string): Promise<DomainResumeCompany> {
    const ormPosition = await this.orm.em.findOneOrFail(OrmResumePosition, positionId, {
      populate: ['resumeCompany']
    });
    const companyId =
      typeof ormPosition.resumeCompany === 'string'
        ? ormPosition.resumeCompany
        : (ormPosition.resumeCompany as { id: string }).id;
    return this.findByIdOrFail(companyId);
  }

  public async save(company: DomainResumeCompany): Promise<void> {
    const existing = await this.orm.em.findOne(OrmResumeCompany, company.id.value);

    if (existing) {
      this.updateCompany(existing, company);
      await this.syncPositions(company);
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
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      });
      this.orm.em.persist(orm);

      for (const position of company.positions) {
        const ormPosition = new OrmResumePosition({
          id: position.id.value,
          resumeCompany: orm,
          title: position.title,
          startDate: position.startDate,
          endDate: position.endDate,
          summary: position.summary,
          ordinal: position.ordinal,
          createdAt: position.createdAt,
          updatedAt: position.updatedAt
        });
        this.orm.em.persist(ormPosition);

        for (const bullet of position.bullets) {
          const ormBullet = new OrmResumeBullet({
            id: bullet.id.value,
            resumePosition: ormPosition,
            content: bullet.content,
            ordinal: bullet.ordinal,
            createdAt: bullet.createdAt,
            updatedAt: bullet.updatedAt
          });
          this.orm.em.persist(ormBullet);
        }
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
    orm.updatedAt = domain.updatedAt;
    this.orm.em.persist(orm);
  }

  private async syncPositions(domain: DomainResumeCompany): Promise<void> {
    const existingPositions = await this.orm.em.find(OrmResumePosition, { resumeCompany: domain.id.value });
    const domainPositionIds = new Set(domain.positions.map(p => p.id.value));
    const existingPositionIds = new Set(existingPositions.map(p => p.id));

    // Remove positions that no longer exist in domain
    for (const existing of existingPositions) {
      if (!domainPositionIds.has(existing.id)) {
        // Remove bullets for deleted position
        const bullets = await this.orm.em.find(OrmResumeBullet, { resumePosition: existing.id });
        for (const b of bullets) this.orm.em.remove(b);
        this.orm.em.remove(existing);
      }
    }

    // Upsert positions
    for (const position of domain.positions) {
      if (existingPositionIds.has(position.id.value)) {
        const ormPosition = existingPositions.find(p => p.id === position.id.value)!;
        ormPosition.title = position.title;
        ormPosition.startDate = position.startDate;
        ormPosition.endDate = position.endDate;
        ormPosition.summary = position.summary;
        ormPosition.ordinal = position.ordinal;
        ormPosition.updatedAt = position.updatedAt;
        this.orm.em.persist(ormPosition);
      } else {
        const companyRef = this.orm.em.getReference(OrmResumeCompany, domain.id.value);
        const ormPosition = new OrmResumePosition({
          id: position.id.value,
          resumeCompany: companyRef,
          title: position.title,
          startDate: position.startDate,
          endDate: position.endDate,
          summary: position.summary,
          ordinal: position.ordinal,
          createdAt: position.createdAt,
          updatedAt: position.updatedAt
        });
        this.orm.em.persist(ormPosition);
      }

      // Sync bullets for this position
      await this.syncBullets(position);
    }
  }

  private async syncBullets(position: DomainResumePosition): Promise<void> {
    const existingBullets = await this.orm.em.find(OrmResumeBullet, { resumePosition: position.id.value });
    const domainBulletIds = new Set(position.bullets.map(b => b.id.value));
    const existingBulletIds = new Set(existingBullets.map(b => b.id));

    for (const existing of existingBullets) {
      if (!domainBulletIds.has(existing.id)) {
        this.orm.em.remove(existing);
      }
    }

    for (const bullet of position.bullets) {
      if (existingBulletIds.has(bullet.id.value)) {
        const ormBullet = existingBullets.find(b => b.id === bullet.id.value)!;
        ormBullet.content = bullet.content;
        ormBullet.ordinal = bullet.ordinal;
        ormBullet.updatedAt = bullet.updatedAt;
        this.orm.em.persist(ormBullet);
      } else {
        const positionRef = this.orm.em.getReference(OrmResumePosition, position.id.value);
        const ormBullet = new OrmResumeBullet({
          id: bullet.id.value,
          resumePosition: positionRef,
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
    const ormPositions = await this.orm.em.find(
      OrmResumePosition,
      { resumeCompany: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );
    const ormLocations = await this.orm.em.find(
      OrmResumeCompanyLocation,
      { resumeCompany: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );

    const positions = await Promise.all(
      ormPositions.map(async ormPos => {
        const ormBullets = await this.orm.em.find(
          OrmResumeBullet,
          { resumePosition: ormPos.id },
          { orderBy: { ordinal: 'ASC' } }
        );

        const bullets = ormBullets.map(
          b =>
            new DomainResumeBullet({
              id: new ResumeBulletId(b.id),
              resumePositionId: ormPos.id,
              content: b.content,
              ordinal: b.ordinal,
              createdAt: b.createdAt,
              updatedAt: b.updatedAt
            })
        );

        return new DomainResumePosition({
          id: new ResumePositionId(ormPos.id),
          resumeCompanyId: orm.id,
          title: ormPos.title,
          startDate: ormPos.startDate,
          endDate: ormPos.endDate,
          summary: ormPos.summary,
          ordinal: ormPos.ordinal,
          bullets,
          createdAt: ormPos.createdAt,
          updatedAt: ormPos.updatedAt
        });
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
      locations,
      positions,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
