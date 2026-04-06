import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';

export function useHeadlines() {
  return useQuery({
    queryKey: queryKeys.headlines.list(),
    queryFn: async () => {
      const { data } = await api.headlines.get();
      return (data?.data ?? []) as {
        id: string;
        label: string;
        summaryText: string;
      }[];
    }
  });
}

export function useCreateHeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { profile_id: string; label: string; summary_text: string }) => {
      const segment = api.headlines as EdenRouteSegment;
      const { data, error } = await segment.post({
        profile_id: input.profile_id,
        label: input.label,
        summary_text: input.summary_text
      });
      if (error) throw new Error(extractApiError(error, `Could not create headline "${input.label}"`));
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.headlines.list() });
    }
  });
}

export function useUpdateHeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; label: string; summary_text: string }) => {
      const segment = api.headlines as EdenRouteSegment;
      const { error } = await segment({ id: input.id }).put({
        label: input.label,
        summary_text: input.summary_text
      });
      if (error) throw new Error(extractApiError(error, `Could not update headline "${input.label}"`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.headlines.list() });
    }
  });
}

export function useDeleteHeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const segment = api.headlines as EdenRouteSegment;
      const { error } = await segment({ id }).delete();
      if (error) throw new Error(extractApiError(error, `Could not delete headline ${id}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.headlines.list() });
    }
  });
}
