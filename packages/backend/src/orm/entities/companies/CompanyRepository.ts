import { Company } from './Company';
import { QueryOpts } from '../../helpers';
import { TransientCompany } from './TransientCompany';
import { BaseRepository } from '../../BaseRepository';

export class CompanyRepository extends BaseRepository<Company> {
  public async resolve(transientCompany: TransientCompany, opts: QueryOpts = {}): Promise<Company> {
    const transientCompanyProps = transientCompany.toProps();

    return this.getEm(opts).upsert(Company, transientCompanyProps, {
      onConflictAction: 'merge',
      onConflictExcludeFields: ['createdAt', 'ignored']
    });
  }
}
