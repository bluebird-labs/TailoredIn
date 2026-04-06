import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';

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

export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: async () => {
      const segment = api.companies as EdenRouteSegment;
      const { data, error } = await segment({ id }).get();
      if (error) throw new Error(extractApiError(error, `Could not load company ${id}`));
      return data?.data as Company;
    }
  });
}

export function useDiscoverCompanies() {
  return useMutation({
    mutationFn: async (input: { query: string }) => {
      const segment = api.companies as EdenRouteSegment;
      const { data, error } = await segment.discover.post(input);
      if (error) throw new Error(extractApiError(error, `Could not discover companies for "${input.query}"`));
      return (data?.data ?? []) as CompanyDiscoveryResult[];
    }
  });
}

export function useEnrichCompany() {
  return useMutation({
    mutationFn: async (input: { url: string; context?: string }) => {
      const segment = api.companies as EdenRouteSegment;
      const { data, error } = await segment.enrich.post(input);
      if (error) throw new Error(extractApiError(error, `Could not enrich company data from ${input.url}`));
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
      const segment = api.companies as EdenRouteSegment;
      const { data, error } = await segment({ id }).put(body);
      if (error) throw new Error(extractApiError(error, `Could not update company "${input.name}"`));
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
      const segment = api.companies as EdenRouteSegment;
      const { data, error } = await segment.post(input);
      if (error) throw new Error(extractApiError(error, `Could not create company "${input.name}"`));
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.list() });
    }
  });
}
