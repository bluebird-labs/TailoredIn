import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty route param types vary
type AnyRouteSegment = any;

export type Company = {
  id: string;
  name: string;
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

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
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
