import { BaseRepository } from '../../BaseRepository.js';
import { Company, type CompanyCreateProps } from './Company.js';

export class CompanyOrmRepository extends BaseRepository<Company> {
  async upsert(props: CompanyCreateProps): Promise<Company> {
    return this.em.upsert(Company, props, {
      onConflictAction: 'merge',
      onConflictExcludeFields: ['createdAt', 'ignored']
    });
  }
}
