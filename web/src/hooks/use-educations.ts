import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty route param types vary
type AnyRouteSegment = any;

export type Education = {
  id: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};

export function useEducations() {
  return useQuery({
    queryKey: queryKeys.educations.list(),
    queryFn: async () => {
      const { data } = await api.educations.get();
      return (data?.data ?? []) as Education[];
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
      const segment = api.educations as AnyRouteSegment;
      const { data, error } = await segment.post(input);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to create education');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.list() });
    }
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      degree_title: string;
      institution_name: string;
      graduation_year: number;
      location: string | null;
      honors: string | null;
      ordinal: number;
    }) => {
      const segment = api.educations as AnyRouteSegment;
      const { error } = await segment({ id: input.id }).put({
        degree_title: input.degree_title,
        institution_name: input.institution_name,
        graduation_year: input.graduation_year,
        location: input.location,
        honors: input.honors,
        ordinal: input.ordinal
      });
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to update education');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.list() });
    }
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const segment = api.educations as AnyRouteSegment;
      const { error } = await segment({ id }).delete();
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to delete education');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.list() });
    }
  });
}
