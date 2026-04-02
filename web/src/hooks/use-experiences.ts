import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useCreateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      company_name: string;
      company_website?: string;
      location: string;
      start_date: string;
      end_date: string;
      summary?: string;
      ordinal: number;
    }) => {
      const { data } = await api.experiences.post(input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}
