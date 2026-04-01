import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useHeadlines() {
  return useQuery({
    queryKey: queryKeys.resume.headlines(),
    queryFn: async () => {
      const { data } = await api.headlines.get();
      return data?.data ?? [];
    }
  });
}
