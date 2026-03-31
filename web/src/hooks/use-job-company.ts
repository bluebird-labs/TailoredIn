import type { BusinessType, CompanyStage, Industry } from '@tailoredin/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useJobCompany(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(companyId),
    queryFn: async () => {
      const res = await api.companies({ id: companyId }).get();
      if (res.error) throw new Error(String(res.error));
      return res.data.data;
    }
  });
}

export function useUpdateJobCompanyClassification(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      business_type?: BusinessType | null;
      industry?: Industry | null;
      stage?: CompanyStage | null;
    }) => {
      const res = await api.companies({ id: companyId }).put(input);
      if (res.error) throw new Error(String(res.error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    }
  });
}
