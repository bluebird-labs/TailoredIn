import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: async () => {
      const { data } = await api.profile.get();
      return data?.data ?? null;
    }
  });
}
