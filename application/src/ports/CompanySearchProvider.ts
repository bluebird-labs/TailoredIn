export type CompanySearchResult = {
  name: string;
  website: string | null;
  description: string | null;
};

export interface CompanySearchProvider {
  searchByName(name: string, description?: string): Promise<CompanySearchResult[]>;
}
