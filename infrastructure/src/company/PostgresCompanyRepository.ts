import { MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { Company, type CompanyCreateProps, type CompanyRepository, EntityNotFoundError } from '@tailoredin/domain';

@Injectable()
export class PostgresCompanyRepository implements CompanyRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findAll(): Promise<Company[]> {
    return this.orm.em.find(Company, {}, { orderBy: { name: 'ASC' } });
  }

  public async findById(id: string): Promise<Company | null> {
    return this.orm.em.findOne(Company, { id });
  }

  public async upsertByLinkedinLink(props: CompanyCreateProps): Promise<Company> {
    const company = await this.orm.em.upsert(Company, props, {
      onConflictAction: 'merge',
      onConflictFields: ['linkedinLink'],
      onConflictExcludeFields: ['createdAt']
    });
    await this.orm.em.flush();
    return company;
  }

  public async save(company: Company): Promise<void> {
    this.orm.em.persist(company);
    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const entity = await this.orm.em.findOne(Company, { id });
    if (!entity) {
      throw new EntityNotFoundError('Company', id);
    }
    this.orm.em.remove(entity);
    await this.orm.em.flush();
  }
}
