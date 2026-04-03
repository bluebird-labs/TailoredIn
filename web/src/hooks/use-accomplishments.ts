import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty merges inconsistent route param names (:id vs :experienceId) causing union type conflicts
type AnyRouteSegment = any;

export function useAddAccomplishment(experienceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      narrative: string;
      skill_tags: string[];
      ordinal: number;
    }) => {
      const segment = api.experiences({ id: experienceId, experienceId } as AnyRouteSegment)
        .accomplishments as AnyRouteSegment;
      const { data, error } = await segment.post(input);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to add accomplishment');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}

export function useUpdateAccomplishment(experienceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      accomplishmentId: string;
      title?: string;
      narrative?: string;
      skill_tags?: string[];
      ordinal?: number;
    }) => {
      const { accomplishmentId, ...body } = input;
      const experienceSegment = api.experiences({ id: experienceId, experienceId } as AnyRouteSegment)
        .accomplishments as AnyRouteSegment;
      const { error } = await experienceSegment({ accomplishmentId }).put(body);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to update accomplishment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}

export function useDeleteAccomplishment(experienceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accomplishmentId: string) => {
      const experienceSegment = api.experiences({ id: experienceId, experienceId } as AnyRouteSegment)
        .accomplishments as AnyRouteSegment;
      const { error } = await experienceSegment({ accomplishmentId }).delete();
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to delete accomplishment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}
