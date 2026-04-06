// application/src/ports/CompanyDataProvider.ts
import type { BusinessType, CompanyStage, CompanyStatus, Industry } from '@tailoredin/domain';

export type CompanyEnrichmentResult = {
  name: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: BusinessType | null;
  industry: Industry | null;
  stage: CompanyStage | null;
  status: CompanyStatus | null;
};

export interface CompanyDataProvider {
  enrichFromUrl(url: string, context?: string): Promise<CompanyEnrichmentResult>;
}
