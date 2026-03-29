import type { Company, CompanyCreateProps } from '@tailoredin/domain-job';

export interface CompanyRepository {
  upsertByLinkedinLink(props: CompanyCreateProps): Promise<Company>;
  save(company: Company): Promise<void>;
}
