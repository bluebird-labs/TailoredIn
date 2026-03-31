import type { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';

export type CompanyDto = {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string;
  businessType: BusinessType | null;
  industry: Industry | null;
  stage: CompanyStage | null;
};
