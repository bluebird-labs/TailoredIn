import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.resume.companies(),
    queryFn: async () => {
      const { data } = await api.resume.companies.get();
      return data;
    }
  });
}
