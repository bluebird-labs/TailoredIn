import { BaseRepository } from '../../BaseRepository.js';
import type { QueryOpts } from '../../helpers.js';
import { Company } from './Company.js';
import type { TransientCompany } from './TransientCompany.js';

export class CompanyRepository extends BaseRepository<Company> {
  public async resolve(transientCompany: TransientCompany, opts: QueryOpts = {}): Promise<Company> {
    const transientCompanyProps = transientCompany.toProps();

    return this.getEm(opts).upsert(Company, transientCompanyProps, {
      onConflictAction: 'merge',
      onConflictExcludeFields: ['createdAt', 'ignored']
    });
  }
}
