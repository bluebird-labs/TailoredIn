import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import type { Company } from './use-companies';

export type ExperienceSkill = {
  id: string;
  skillId: string;
  skill: {
    id: string;
    label: string;
    type: string;
    categoryId: string | null;
    category: { id: string; label: string } | null;
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
    queryFn: async () => {
      const { data } = await api.experiences.get();
      return (data?.data ?? []) as Experience[];
    }
  });
}

export function useExperience(id: string) {
  return useQuery({
    queryKey: queryKeys.experiences.detail(id),
    queryFn: async () => {
      const segment = api.experiences as EdenRouteSegment;
      const { data, error } = await segment({ id }).get();
      if (error) throw new Error(extractApiError(error, `Could not load experience ${id}`));
      return data?.data as Experience;
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
      company_accent?: string;
      location: string;
      start_date: string;
      end_date: string;
      summary?: string;
      ordinal: number;
    }) => {
      const segment = api.experiences as EdenRouteSegment;
      const { data, error } = await segment.post(input);
      if (error) throw new Error(extractApiError(error, `Could not create experience "${input.title}"`));
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
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
      const { data, error } = await api.experiences({ id }).put(body);
      if (error)
        throw new Error(extractApiError(error as EdenRouteSegment, `Could not update experience "${input.title}"`));
      return (data as EdenRouteSegment)?.data as Experience;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const segment = api.experiences as EdenRouteSegment;
      const { error } = await segment({ id }).delete();
      if (error) throw new Error(extractApiError(error, `Could not delete experience ${id}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useLinkCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { experienceId: string; companyId: string }) => {
      const { data, error } = await api.experiences({ id: input.experienceId }).company.put({
        company_id: input.companyId
      });
      if (error)
        throw new Error(
          extractApiError(error as EdenRouteSegment, `Could not link company to experience ${input.experienceId}`)
        );
      return (data as EdenRouteSegment)?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}

export function useUnlinkCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (experienceId: string) => {
      const { data, error } = await api.experiences({ id: experienceId }).company.delete();
      if (error)
        throw new Error(
          extractApiError(error as EdenRouteSegment, `Could not unlink company from experience ${experienceId}`)
        );
      return (data as EdenRouteSegment)?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}
