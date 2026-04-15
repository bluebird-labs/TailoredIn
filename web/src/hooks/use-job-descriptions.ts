import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';

export type SalaryRangeDto = {
  min: number | null;
  max: number | null;
  currency: string;
};

export type ResumeOutputExperience = {
  experienceId: string;
  experienceTitle: string;
  companyName: string;
  startDate: string;
  endDate: string;
  summary: string;
  bullets: string[];
  hiddenBulletIndices: number[];
};

export type RequirementScore = {
  requirement: string;
  coverage: 'strong' | 'partial' | 'absent';
  matchingBulletIndices: number[];
  reasoning: string;
};

export type ResumeScore = {
  overall: number;
  requirements: RequirementScore[];
  summary: string;
};

export type FitRequirementScore = {
  requirement: string;
  coverage: 'strong' | 'partial' | 'not_evidenced' | 'absent';
  reasoning: string;
};

export type FitScore = {
  id: string;
  overall: number;
  requirements: FitRequirementScore[];
  summary: string;
  createdAt: string;
};

export type ResumeOutput = {
  resumeContentId: string;
  headline?: string;
  experiences: ResumeOutputExperience[];
  hiddenEducationIds: string[];
  generatedAt: string;
  scopedInstructions: Record<string, string>;
  score: ResumeScore | null;
};

export type JobDescription = {
  id: string;
  companyId: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  title: string;
  description: string;
  url: string | null;
  location: string | null;
  salaryRange: SalaryRangeDto | null;
  level: string;
  locationType: string;
  source: string;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rawText: string | null;
  soughtHardSkills: string[] | null;
  soughtSoftSkills: string[] | null;
  resumeOutput: ResumeOutput | null;
  hasCachedPdf: boolean;
  resumePdfTheme: string | null;
  fitScore: FitScore | null;
};

export type JobDescriptionParseResult = {
  title: string | null;
  description: string | null;
  url: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  level: string | null;
  locationType: string | null;
  postedAt: string | null;
  soughtHardSkills: string[] | null;
  soughtSoftSkills: string[] | null;
};

export function useJobDescriptions(companyId?: string) {
  return useQuery({
    queryKey: companyId ? queryKeys.jobDescriptions.list(companyId) : queryKeys.jobDescriptions.listAll(),
    queryFn: async () => {
      const segment = api['job-descriptions'] as EdenRouteSegment;
      const query = companyId ? { company_id: companyId } : {};
      const { data } = await segment.get({ query });
      return (data?.data ?? []) as JobDescription[];
    }
  });
}

export function useJobDescription(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.jobDescriptions.detail(id),
    queryFn: async () => {
      const segment = api['job-descriptions'] as EdenRouteSegment;
      const { data, error } = await segment({ id }).get();
      if (error) throw new Error(extractApiError(error, `Could not load job description ${id}`));
      return data?.data as JobDescription;
    },
    enabled: options?.enabled
  });
}

export function useParseJobDescription() {
  return useMutation({
    mutationFn: async (input: { text: string }) => {
      const segment = api['job-descriptions'] as EdenRouteSegment;
      const { data, error } = await segment.parse.post(input);
      if (error) throw new Error(extractApiError(error, 'Could not parse job description text'));
      return data?.data as JobDescriptionParseResult;
    }
  });
}

export function useExtractText() {
  return useMutation({
    mutationFn: async (file: File) => {
      const segment = api.factory as EdenRouteSegment;
      const { data, error } = await segment['extract-text'].post({ file });
      if (error) throw new Error(extractApiError(error, `Could not extract text from "${file.name}"`));
      return (data?.data as { text: string }).text;
    }
  });
}

export function useCreateJobDescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      company_id: string;
      title: string;
      description: string;
      url?: string | null;
      location?: string | null;
      salary_min?: number | null;
      salary_max?: number | null;
      salary_currency?: string | null;
      level?: string;
      location_type?: string;
      source: string;
      posted_at?: string | null;
      raw_text?: string | null;
      sought_hard_skills?: string[] | null;
      sought_soft_skills?: string[] | null;
    }) => {
      const segment = api['job-descriptions'] as EdenRouteSegment;
      const { data, error } = await segment.post(input);
      if (error) throw new Error(extractApiError(error, `Could not create job description "${input.title}"`));
      return data?.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.list(variables.company_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.listAll() });
    }
  });
}

export function useUpdateJobDescription(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      company_id: string;
      title: string;
      description: string;
      url?: string | null;
      location?: string | null;
      salary_min?: number | null;
      salary_max?: number | null;
      salary_currency?: string | null;
      level?: string;
      location_type?: string;
      source: string;
      posted_at?: string | null;
      raw_text?: string | null;
      sought_hard_skills?: string[] | null;
      sought_soft_skills?: string[] | null;
    }) => {
      const { id, ...body } = input;
      const segment = api['job-descriptions'] as EdenRouteSegment;
      const { data, error } = await segment({ id }).put(body);
      if (error) throw new Error(extractApiError(error, `Could not update job description "${input.title}"`));
      return data?.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.list(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.listAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(variables.id) });
    }
  });
}

export function useDeleteJobDescription(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const segment = api['job-descriptions'] as EdenRouteSegment;
      const { error } = await segment({ id }).delete();
      if (error) throw new Error(extractApiError(error, `Could not delete job description ${id}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.list(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.listAll() });
    }
  });
}
