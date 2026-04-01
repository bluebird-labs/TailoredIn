import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useEducations() {
  return useQuery({
    queryKey: queryKeys.educations.list(),
    queryFn: async () => {
      const { data } = await api.educations.get();
      return data;
    }
  });
}

export function useCreateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      degree_title: string;
      institution_name: string;
      graduation_year: number;
      location: string | null;
      honors: string | null;
      ordinal: number;
    }) => {
      const { data } = await api.educations.post(input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.all });
    }
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      degree_title: string;
      institution_name: string;
      graduation_year: number;
      location: string | null;
      honors: string | null;
      ordinal: number;
    }) => {
      const { data } = await api.educations({ id }).put(body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.all });
    }
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.educations({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.all });
    }
  });
}
