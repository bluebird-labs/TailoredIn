import type { BusinessType, Company, CompanyStage, Industry } from '@tailoredin/domain';

export type CompanyDto = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: BusinessType | null;
  industry: Industry | null;
  stage: CompanyStage | null;
};

export function toCompanyDto(company: Company): CompanyDto {
  return {
    id: company.id.value,
    name: company.name,
    description: company.description,
    website: company.website,
    logoUrl: company.logoUrl,
    linkedinLink: company.linkedinLink,
    businessType: company.businessType,
    industry: company.industry,
    stage: company.stage
  };
}
