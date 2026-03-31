import { CompanyId, type CompanyRepository } from '@tailoredin/domain';
import type { CompanyDto } from '../dtos/CompanyDto.js';

export type GetJobCompanyInput = {
  companyId: string;
};

export class GetJobCompany {
  public constructor(private readonly companyRepository: CompanyRepository) {}

  public async execute(input: GetJobCompanyInput): Promise<CompanyDto> {
    const company = await this.companyRepository.findById(new CompanyId(input.companyId));
    if (!company) throw new Error(`Company not found: ${input.companyId}`);

    return {
      id: company.id.value,
      name: company.name,
      website: company.website,
      logoUrl: company.logoUrl,
      linkedinLink: company.linkedinLink,
      businessType: company.businessType,
      industry: company.industry,
      stage: company.stage
    };
  }
}
