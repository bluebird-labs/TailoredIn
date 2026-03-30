import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useHeadlines(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.resume.headlines(),
    queryFn: async () => {
      const { data } = await api.users({ userId: userId! }).resume.headlines.get();
      return data;
    },
    enabled: !!userId
  });
}
