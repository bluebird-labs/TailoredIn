import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useAddAccomplishment(experienceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; narrative: string; ordinal: number }) => {
      const { data, error } = await api.experiences({ id: experienceId }).accomplishments.post(input);
      if (error) throw new Error('Failed to add accomplishment');
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
    mutationFn: async (input: { accomplishmentId: string; title?: string; narrative?: string; ordinal?: number }) => {
      const { accomplishmentId, ...body } = input;
      const { error } = await api.experiences({ id: experienceId }).accomplishments({ accomplishmentId }).put(body);
      if (error) throw new Error('Failed to update accomplishment');
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
      const { error } = await api.experiences({ id: experienceId }).accomplishments({ accomplishmentId }).delete();
      if (error) throw new Error('Failed to delete accomplishment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}
