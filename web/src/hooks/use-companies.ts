import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type Company = {
  id: string;
  name: string;
  domainName: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: string;
  industry: string;
  stage: string;
  status: string;
};

export type CompanyDiscoveryResult = {
  name: string;
  website: string | null;
  description: string | null;
};

export type CompanyEnrichmentResult = {
  name: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: string | null;
  industry: string | null;
  stage: string | null;
  status: string | null;
};

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies.list(),
    queryFn: () => api.get<Company[]>('/companies')
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => api.get<Company>(`/companies/${id}`)
  });
}

export function useDiscoverCompanies() {
  return useMutation({
    mutationFn: (input: { query: string }) => api.post<CompanyDiscoveryResult[]>('/companies/discover', input)
  });
}

export function useEnrichCompany() {
  return useMutation({
    mutationFn: (input: { url: string; context?: string }) =>
      api.post<CompanyEnrichmentResult>('/companies/enrich', input)
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      name: string;
      domain_name: string;
      description?: string | null;
      website?: string | null;
      logo_url?: string | null;
      linkedin_link?: string | null;
      business_type?: string;
      industry?: string;
      stage?: string;
      status?: string;
    }) => {
      const { id, ...body } = input;
      return api.put<Company>(`/companies/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    }
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.all });
    }
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      domain_name: string;
      description?: string | null;
      website?: string | null;
      logo_url?: string | null;
      linkedin_link?: string | null;
      business_type?: string;
      industry?: string;
      stage?: string;
      status?: string;
    }) => api.post<Company>('/companies', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    }
  });
}
