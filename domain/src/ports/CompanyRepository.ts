import type { Company, CompanyCreateProps } from '../entities/Company.js';
import type { CompanyId } from '../value-objects/CompanyId.js';

export interface CompanyRepository {
  findAll(): Promise<Company[]>;
  findById(id: CompanyId): Promise<Company | null>;
  upsertByLinkedinLink(props: CompanyCreateProps): Promise<Company>;
  save(company: Company): Promise<void>;
}
