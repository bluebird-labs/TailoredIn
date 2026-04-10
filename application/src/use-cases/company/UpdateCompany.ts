import type { BusinessType, CompanyRepository, CompanyStage, CompanyStatus, Industry } from '@tailoredin/domain';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export type UpdateCompanyInput = {
  companyId: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  businessType: BusinessType | null;
  industry: Industry | null;
  stage: CompanyStage | null;
  status: CompanyStatus | null;
};

export class UpdateCompany {
  public constructor(private readonly companyRepository: CompanyRepository) {}

  public async execute(input: UpdateCompanyInput): Promise<CompanyDto> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new Error(`Company not found: ${input.companyId}`);
    }

    company.name = input.name;
    company.description = input.description;
    company.website = input.website;
    company.logoUrl = input.logoUrl;
    company.setBusinessType(input.businessType);
    company.setIndustry(input.industry);
    company.setStage(input.stage);
    company.setStatus(input.status);

    await this.companyRepository.save(company);
    return toCompanyDto(company);
  }
}
