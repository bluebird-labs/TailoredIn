import type { CompanyBrief } from '../entities/CompanyBrief.js';

export interface CompanyBriefRepository {
  findByCompanyId(companyId: string): Promise<CompanyBrief | null>;
  save(brief: CompanyBrief): Promise<void>;
}
