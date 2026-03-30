import type { MikroORM } from '@mikro-orm/postgresql';
import { injectable } from '@needle-di/core';
import {
  type CompanyCreateProps,
  CompanyId,
  type CompanyRepository,
  Company as DomainCompany
} from '@tailoredin/domain';
import { Company as OrmCompany } from '../db/entities/companies/Company.js';
import type { CompanyOrmRepository } from '../db/entities/companies/CompanyOrmRepository.js';

@injectable()
export class PostgresCompanyRepository implements CompanyRepository {
  public constructor(private readonly orm: MikroORM) {}

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
      ignored: orm.ignored,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
