import type { Company, CompanyCreateProps } from '../entities/Company.js';

export interface CompanyRepository {
  upsertByLinkedinLink(props: CompanyCreateProps): Promise<Company>;
  save(company: Company): Promise<void>;
}
