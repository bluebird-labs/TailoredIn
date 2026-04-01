import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTags(dimension?: string) {
  return useQuery({
    queryKey: dimension ? queryKeys.tags.byDimension(dimension) : queryKeys.tags.all,
    queryFn: async () => {
      const { data } = await api.tags.get({ query: { dimension } });
      return data?.data ?? [];
    }
  });
}
