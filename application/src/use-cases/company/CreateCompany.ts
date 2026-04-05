import type { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';
import { Company, type CompanyRepository } from '@tailoredin/domain';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export type CreateCompanyInput = {
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: BusinessType | null;
  industry: Industry | null;
  stage: CompanyStage | null;
};

export class CreateCompany {
  public constructor(private readonly companyRepository: CompanyRepository) {}

  public async execute(input: CreateCompanyInput): Promise<CompanyDto> {
    const company = Company.create({
      name: input.name,
      description: input.description,
      website: input.website,
      logoUrl: input.logoUrl,
      linkedinLink: input.linkedinLink,
      businessType: input.businessType,
      industry: input.industry,
      stage: input.stage
    });
    await this.companyRepository.save(company);
    return toCompanyDto(company);
  }
}
