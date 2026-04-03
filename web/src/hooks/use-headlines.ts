import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty route param types vary
type AnyRouteSegment = any;

export function useHeadlines() {
  return useQuery({
    queryKey: queryKeys.resume.headlines(),
    queryFn: async () => {
      const { data } = await api.headlines.get();
      return (data?.data ?? []) as {
        id: string;
        label: string;
        summaryText: string;
        roleTags: { id: string; name: string; dimension: string }[];
      }[];
    }
  });
}

export function useCreateHeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { profile_id: string; label: string; summary_text: string; role_tag_ids?: string[] }) => {
      const segment = api.headlines as AnyRouteSegment;
      const { data, error } = await segment.post({
        profile_id: input.profile_id,
        label: input.label,
        summary_text: input.summary_text,
        role_tag_ids: input.role_tag_ids ?? []
      });
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to create headline');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.headlines() });
    }
  });
}

export function useUpdateHeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; label: string; summary_text: string; role_tag_ids?: string[] }) => {
      const segment = api.headlines as AnyRouteSegment;
      const { error } = await segment({ id: input.id }).put({
        label: input.label,
        summary_text: input.summary_text,
        role_tag_ids: input.role_tag_ids ?? []
      });
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to update headline');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.headlines() });
    }
  });
}

export function useDeleteHeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const segment = api.headlines as AnyRouteSegment;
      const { error } = await segment({ id }).delete();
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to delete headline');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.headlines() });
    }
  });
}
