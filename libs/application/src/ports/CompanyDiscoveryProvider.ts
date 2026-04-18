export type CompanyDiscoveryResult = {
  name: string;
  website: string | null;
  description: string | null;
};

export interface CompanyDiscoveryProvider {
  discover(query: string): Promise<CompanyDiscoveryResult[]>;
}
