import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Company } from './use-companies';

export type ExperienceSkill = {
  id: string;
  skillId: string;
  skill: {
    id: string;
    label: string;
    kind: string;
    categoryId: string | null;
    category: { id: string; label: string; parentId: string | null } | null;
    description: string | null;
  };
};

export type Experience = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyAccent: string | null;
  companyId: string | null;
  company: Company | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  bulletMin: number;
  bulletMax: number;
  accomplishments: AccomplishmentDto[];
  skills: ExperienceSkill[];
};

export type AccomplishmentDto = {
  id: string;
  title: string;
  narrative: string;
  ordinal: number;
};

export function useExperiences() {
  return useQuery({
    queryKey: queryKeys.experiences.list(),
    queryFn: () => api.get<Experience[]>('/experiences')
  });
}

export function useExperience(id: string) {
  return useQuery({
    queryKey: queryKeys.experiences.detail(id),
    queryFn: () => api.get<Experience>(`/experiences/${id}`)
  });
}

export function useCreateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      company_name: string;
      company_website?: string;
      company_accent?: string;
      location: string;
      start_date: string;
      end_date: string;
      summary?: string;
      ordinal: number;
    }) => api.post<Experience>('/experiences', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      title: string;
      company_name: string;
      company_website?: string;
      company_accent?: string;
      location: string;
      start_date: string;
      end_date: string;
      summary?: string;
      ordinal: number;
      accomplishments: { id: string | null; title: string; narrative: string; ordinal: number }[];
      bullet_min?: number;
      bullet_max?: number;
    }) => {
      const { id, ...body } = input;
      return api.put<Experience>(`/experiences/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/experiences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useAddAccomplishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { experienceId: string; title: string; narrative: string; ordinal: number }) => {
      const { experienceId, ...body } = input;
      return api.post(`/experiences/${experienceId}/accomplishments`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useUpdateAccomplishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      experienceId: string;
      accomplishmentId: string;
      title?: string;
      narrative?: string;
      ordinal?: number;
    }) => {
      const { experienceId, accomplishmentId, ...body } = input;
      return api.put(`/experiences/${experienceId}/accomplishments/${accomplishmentId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useDeleteAccomplishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { experienceId: string; accomplishmentId: string }) =>
      api.delete(`/experiences/${input.experienceId}/accomplishments/${input.accomplishmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useLinkCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { experienceId: string; companyId: string }) =>
      api.put(`/experiences/${input.experienceId}/company`, { company_id: input.companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useUnlinkCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (experienceId: string) => api.delete(`/experiences/${experienceId}/company`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}
