import { Company } from './Company.js';
import { QueryOpts } from '../../helpers.js';
import { TransientCompany } from './TransientCompany.js';
import { BaseRepository } from '../../BaseRepository.js';

export class CompanyRepository extends BaseRepository<Company> {
  public async resolve(transientCompany: TransientCompany, opts: QueryOpts = {}): Promise<Company> {
    const transientCompanyProps = transientCompany.toProps();

    return this.getEm(opts).upsert(Company, transientCompanyProps, {
      onConflictAction: 'merge',
      onConflictExcludeFields: ['createdAt', 'ignored']
    });
  }
}
