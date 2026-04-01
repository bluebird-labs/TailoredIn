import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useExperiences() {
  return useQuery({
    queryKey: queryKeys.experiences.list(),
    queryFn: async () => {
      const { data } = await api.experiences.get();
      return data?.data ?? [];
    }
  });
}
