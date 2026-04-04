// application/src/ports/CompanyDataProvider.ts
import type { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';

export type CompanyEnrichmentResult = {
  name: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: BusinessType | null;
  industry: Industry | null;
  stage: CompanyStage | null;
};

export interface CompanyDataProvider {
  enrichFromUrl(url: string): Promise<CompanyEnrichmentResult>;
}
