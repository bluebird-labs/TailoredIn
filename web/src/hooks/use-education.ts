import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type Education = {
  id: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};

/** @deprecated Use useEducations() — kept for archetypes page until S6 rewrites it */
export function useEducation(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.resume.education(),
    queryFn: async () => {
      const { data } = await api.users({ userId: userId! }).resume.education.get();
      return data;
    },
    enabled: !!userId
  });
}

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
