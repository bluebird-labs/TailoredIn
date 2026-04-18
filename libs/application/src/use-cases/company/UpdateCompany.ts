import { Inject, Injectable } from '@nestjs/common';
import type { BusinessType, CompanyRepository, CompanyStage, CompanyStatus, Industry } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export type UpdateCompanyInput = {
  companyId: string;
  name: string;
  domainName: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: BusinessType;
  industry: Industry;
  stage: CompanyStage;
  status: CompanyStatus;
};

@Injectable()
export class UpdateCompany {
  public constructor(@Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository) {}

  public async execute(input: UpdateCompanyInput): Promise<CompanyDto> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new Error(`Company not found: ${input.companyId}`);
    }

    company.name = input.name;
    company.setDomainName(input.domainName);
    company.description = input.description;
    company.website = input.website;
    company.logoUrl = input.logoUrl;
    company.setLinkedinLink(input.linkedinLink);
    company.setBusinessType(input.businessType);
    company.setIndustry(input.industry);
    company.setStage(input.stage);
    company.setStatus(input.status);

    await this.companyRepository.save(company);
    return toCompanyDto(company);
  }
}
