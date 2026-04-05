import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty route param types vary
type AnyRouteSegment = any;

export type Company = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: string | null;
  industry: string | null;
  stage: string | null;
};

export type CompanySearchResult = {
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
};

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies.list(),
    queryFn: async () => {
      const { data } = await api.companies.get();
      return (data?.data ?? []) as Company[];
    }
  });
}

export function useSearchCompanies() {
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const segment = api.companies as AnyRouteSegment;
      const { data, error } = await segment.search.post(input);
      if (error) throw new Error('Failed to search companies');
      return (data?.data ?? []) as CompanySearchResult[];
    }
  });
}

export function useEnrichCompany() {
  return useMutation({
    mutationFn: async (input: { url: string; context?: string }) => {
      const segment = api.companies as AnyRouteSegment;
      const { data, error } = await segment.enrich.post(input);
      if (error) throw new Error('Failed to enrich company data');
      return data?.data as CompanyEnrichmentResult;
    }
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      description?: string | null;
      website?: string | null;
      logo_url?: string | null;
      linkedin_link?: string | null;
      business_type?: string | null;
      industry?: string | null;
      stage?: string | null;
    }) => {
      const { id, ...body } = input;
      const segment = api.companies as AnyRouteSegment;
      const { data, error } = await segment({ id }).put(body);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to update company');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.list() });
    }
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string | null;
      website?: string | null;
      logo_url?: string | null;
      linkedin_link?: string | null;
      business_type?: string | null;
      industry?: string | null;
      stage?: string | null;
    }) => {
      const segment = api.companies as AnyRouteSegment;
      const { data, error } = await segment.post(input);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to create company');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.list() });
    }
  });
}
