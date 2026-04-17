import { Inject, Injectable } from '@nestjs/common';
import type { BusinessType, CompanyStage, CompanyStatus, Industry } from '@tailoredin/domain';
import { Company, type CompanyRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export type CreateCompanyInput = {
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
export class CreateCompany {
  public constructor(@Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository) {}

  public async execute(input: CreateCompanyInput): Promise<CompanyDto> {
    const company = Company.create({
      name: input.name,
      domainName: input.domainName,
      description: input.description,
      website: input.website,
      logoUrl: input.logoUrl,
      linkedinLink: input.linkedinLink,
      businessType: input.businessType,
      industry: input.industry,
      stage: input.stage,
      status: input.status
    });
    await this.companyRepository.save(company);
    return toCompanyDto(company);
  }
}
