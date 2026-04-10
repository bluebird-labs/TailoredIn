import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Company, type CompanyCreateProps, type CompanyRepository, EntityNotFoundError } from '@tailoredin/domain';

@injectable()
export class PostgresCompanyRepository implements CompanyRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findAll(): Promise<Company[]> {
    return this.orm.em.find(Company, {}, { orderBy: { name: 'ASC' } });
  }

  public async findById(id: string): Promise<Company | null> {
    return this.orm.em.findOne(Company, { id });
  }

  public async upsertByLinkedinLink(props: CompanyCreateProps): Promise<Company> {
    // biome-ignore lint/suspicious/noExplicitAny: MikroORM FilterQuery type mismatch with custom PK
    const company = await this.orm.em.upsert(Company, props as any, {
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
