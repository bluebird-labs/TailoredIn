import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { CompanyBriefId, type CompanyBriefRepository, CompanyBrief as DomainCompanyBrief } from '@tailoredin/domain';
import { CompanyBrief as OrmCompanyBrief } from '../db/entities/companies/CompanyBrief.js';

@injectable()
export class PostgresCompanyBriefRepository implements CompanyBriefRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByCompanyId(companyId: string): Promise<DomainCompanyBrief | null> {
    const orm = await this.orm.em.findOne(OrmCompanyBrief, { companyId });
    return orm ? this.toDomain(orm) : null;
  }

  public async save(brief: DomainCompanyBrief): Promise<void> {
    let ormBrief = await this.orm.em.findOne(OrmCompanyBrief, brief.id.value);
    if (ormBrief) {
      ormBrief.productOverview = brief.productOverview;
      ormBrief.techStack = brief.techStack;
      ormBrief.culture = brief.culture;
      ormBrief.recentNews = brief.recentNews;
      ormBrief.keyPeople = brief.keyPeople;
      ormBrief.updatedAt = brief.updatedAt;
    } else {
      ormBrief = new OrmCompanyBrief({
        id: brief.id.value,
        companyId: brief.companyId,
        productOverview: brief.productOverview,
        techStack: brief.techStack,
        culture: brief.culture,
        recentNews: brief.recentNews,
        keyPeople: brief.keyPeople,
        createdAt: brief.createdAt,
        updatedAt: brief.updatedAt
      });
      this.orm.em.persist(ormBrief);
    }
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmCompanyBrief): DomainCompanyBrief {
    return new DomainCompanyBrief({
      id: new CompanyBriefId(orm.id),
      companyId: orm.companyId,
      productOverview: orm.productOverview,
      techStack: orm.techStack,
      culture: orm.culture,
      recentNews: orm.recentNews,
      keyPeople: orm.keyPeople,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
