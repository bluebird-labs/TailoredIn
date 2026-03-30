import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

function educationApi(userId: string) {
  return api.users({ userId }).resume.education;
}

export function useEducation(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.resume.education(),
    queryFn: async () => {
      const { data } = await educationApi(userId!).get();
      return data;
    },
    enabled: !!userId
  });
}

export function useCreateEducation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      degree_title: string;
      institution_name: string;
      graduation_year: string;
      location_label: string;
      ordinal: number;
    }) => {
      const { data } = await educationApi(userId!).post(input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.education() });
    }
  });
}

export function useUpdateEducation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      degree_title: string;
      institution_name: string;
      graduation_year: string;
      location_label: string;
      ordinal: number;
    }) => {
      const { data } = await educationApi(userId!)({ id }).put(body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.education() });
    }
  });
}

export function useDeleteEducation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await educationApi(userId!)({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.education() });
    }
  });
}
