import type { BusinessType, Company, CompanyStage, CompanyStatus, Industry } from '@tailoredin/domain';

export type CompanyDto = {
  id: string;
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

export function toCompanyDto(company: Company): CompanyDto {
  return {
    id: company.id,
    name: company.name,
    domainName: company.domainName,
    description: company.description,
    website: company.website,
    logoUrl: company.logoUrl,
    linkedinLink: company.linkedinLink,
    businessType: company.businessType,
    industry: company.industry,
    stage: company.stage,
    status: company.status
  };
}
