import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const { data } = await api.user.get();
      return data;
    }
  });
}
