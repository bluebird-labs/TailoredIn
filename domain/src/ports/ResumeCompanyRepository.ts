import type { ResumeCompany } from '../entities/ResumeCompany.js';

export interface ResumeCompanyRepository {
  findByIdOrFail(id: string): Promise<ResumeCompany>;
  findAllByUserId(userId: string): Promise<ResumeCompany[]>;
  save(company: ResumeCompany): Promise<void>;
  findByPositionIdOrFail(positionId: string): Promise<ResumeCompany>;
  delete(id: string): Promise<void>;
}
