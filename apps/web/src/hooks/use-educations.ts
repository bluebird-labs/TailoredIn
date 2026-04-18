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
  hiddenByDefault: boolean;
};

export function useEducations() {
  return useQuery({
    queryKey: queryKeys.educations.list(),
    queryFn: () => api.get<Education[]>('/educations')
  });
}

export function useCreateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      degree_title: string;
      institution_name: string;
      graduation_year: number;
      location: string | null;
      honors: string | null;
      ordinal: number;
      hidden_by_default?: boolean;
    }) => api.post<Education>('/educations', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.list() });
    }
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      degree_title: string;
      institution_name: string;
      graduation_year: number;
      location: string | null;
      honors: string | null;
      ordinal: number;
      hidden_by_default: boolean;
    }) => {
      const { id, ...body } = input;
      return api.put(`/educations/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.list() });
    }
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/educations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.list() });
    }
  });
}
