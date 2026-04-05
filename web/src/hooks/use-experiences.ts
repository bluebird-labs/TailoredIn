import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Company } from './use-companies';

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty route param types vary
type AnyRouteSegment = any;

export type Experience = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyId: string | null;
  company: Company | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  accomplishments: AccomplishmentDto[];
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
    queryFn: async () => {
      const { data } = await api.experiences.get();
      return (data?.data ?? []) as Experience[];
    }
  });
}

export function useCreateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      company_name: string;
      company_website?: string;
      location: string;
      start_date: string;
      end_date: string;
      summary?: string;
      ordinal: number;
    }) => {
      const segment = api.experiences as AnyRouteSegment;
      const { data, error } = await segment.post(input);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to create experience');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title: string;
      company_name: string;
      company_website?: string;
      location: string;
      start_date: string;
      end_date: string;
      summary?: string;
      ordinal: number;
    }) => {
      const segment = api.experiences as AnyRouteSegment;
      const { id, ...body } = input;
      const { error } = await segment({ id, experienceId: id }).put(body);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to update experience');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const segment = api.experiences as AnyRouteSegment;
      const { error } = await segment({ id }).delete();
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to delete experience');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}

export function useLinkCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { experienceId: string; companyId: string }) => {
      const segment = api.experiences as AnyRouteSegment;
      const { data, error } = await segment({ id: input.experienceId }).company.put({
        company_id: input.companyId
      });
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to link company');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}

export function useUnlinkCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (experienceId: string) => {
      const segment = api.experiences as AnyRouteSegment;
      const { data, error } = await segment({ id: experienceId }).company.delete();
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to unlink company');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}
