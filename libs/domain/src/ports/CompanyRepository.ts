import type { Company, CompanyCreateProps } from '../entities/Company.js';

export interface CompanyRepository {
  findAll(): Promise<Company[]>;
  findById(id: string): Promise<Company | null>;
  upsertByLinkedinLink(props: CompanyCreateProps): Promise<Company>;
  save(company: Company): Promise<void>;
  delete(id: string): Promise<void>;
}
