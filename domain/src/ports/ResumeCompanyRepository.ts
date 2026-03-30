import type { ResumeCompany } from '../entities/ResumeCompany.js';

export interface ResumeCompanyRepository {
  findByIdOrFail(id: string): Promise<ResumeCompany>;
  findAllByUserId(userId: string): Promise<ResumeCompany[]>;
  save(company: ResumeCompany): Promise<void>;
  delete(id: string): Promise<void>;
}
