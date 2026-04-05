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

  public async findAll(): Promise<DomainCompany[]> {
    const ormEntities = await this.orm.em.find(OrmCompany, {}, { orderBy: { name: 'ASC' } });
    return ormEntities.map(e => this.toDomain(e));
  }

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
    let ormCompany = await this.orm.em.findOne(OrmCompany, company.id.value);

    if (ormCompany) {
      ormCompany.name = company.name;
      ormCompany.description = company.description;
      ormCompany.website = company.website;
      ormCompany.logoUrl = company.logoUrl;
      ormCompany.businessType = company.businessType;
      ormCompany.industry = company.industry;
      ormCompany.stage = company.stage;
      ormCompany.updatedAt = company.updatedAt;
    } else {
      ormCompany = this.orm.em.create(OrmCompany, {
        id: company.id.value,
        name: company.name,
        description: company.description,
        website: company.website,
        logoUrl: company.logoUrl,
        linkedinLink: company.linkedinLink,
        businessType: company.businessType,
        industry: company.industry,
        stage: company.stage,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      });
    }

    this.orm.em.persist(ormCompany);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmCompany): DomainCompany {
    return new DomainCompany({
      id: new CompanyId(orm.id),
      name: orm.name,
      description: orm.description,
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
