import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  type BusinessType,
  type CompanyCreateProps,
  CompanyId,
  type CompanyRepository,
  type CompanyStage,
  Company as DomainCompany,
  type Industry
} from '@tailoredin/domain';
import { Company as OrmCompany } from '../db/entities/companies/Company.js';
import type { CompanyOrmRepository } from '../db/entities/companies/CompanyOrmRepository.js';

@injectable()
export class PostgresCompanyRepository implements CompanyRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findById(id: CompanyId): Promise<DomainCompany | null> {
    const orm = await this.orm.em.findOne(OrmCompany, id.value);
    return orm ? this.toDomain(orm) : null;
  }

  public async upsertByLinkedinLink(props: CompanyCreateProps): Promise<DomainCompany> {
    const repo = this.orm.em.getRepository(OrmCompany) as CompanyOrmRepository;
    const ormCompany = await repo.upsert(props);
    await this.orm.em.flush();
    return this.toDomain(ormCompany);
  }

  public async save(company: DomainCompany): Promise<void> {
    const ormCompany = await this.orm.em.findOneOrFail(OrmCompany, company.id.value);
    ormCompany.name = company.name;
    ormCompany.website = company.website;
    ormCompany.logoUrl = company.logoUrl;
    ormCompany.businessType = company.businessType;
    ormCompany.industry = company.industry;
    ormCompany.stage = company.stage;
    ormCompany.updatedAt = company.updatedAt;
    this.orm.em.persist(ormCompany);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmCompany): DomainCompany {
    return new DomainCompany({
      id: new CompanyId(orm.id),
      name: orm.name,
      website: orm.website,
      logoUrl: orm.logoUrl,
      linkedinLink: orm.linkedinLink,
      businessType: orm.businessType as BusinessType | null,
      industry: orm.industry as Industry | null,
      stage: orm.stage as CompanyStage | null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
