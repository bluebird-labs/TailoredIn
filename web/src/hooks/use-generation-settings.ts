import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';

export type GenerationPromptDto = {
  id: string;
  scope: string;
  content: string;
};

export type ExperienceOverrideDto = {
  experienceId: string;
  bulletMin: number;
  bulletMax: number;
};

export type GenerationSettings = {
  id: string;
  profileId: string;
  modelTier: string;
  bulletMin: number;
  bulletMax: number;
  prompts: GenerationPromptDto[];
  experienceOverrides: ExperienceOverrideDto[];
};

type PromptScope = 'resume' | 'headline' | 'experience';
const SCOPES: PromptScope[] = ['resume', 'headline', 'experience'];

export function promptsToRecord(prompts: GenerationPromptDto[]): Record<PromptScope, string> {
  const record: Record<PromptScope, string> = { resume: '', headline: '', experience: '' };
  for (const p of prompts) {
    if (SCOPES.includes(p.scope as PromptScope)) {
      record[p.scope as PromptScope] = p.content;
    }
  }
  return record;
}

export function recordToPrompts(record: Record<PromptScope, string>): Array<{ scope: string; content: string | null }> {
  return SCOPES.map(scope => ({
    scope,
    content: record[scope].trim() || null
  }));
}

export function useGenerationSettings() {
  return useQuery({
    queryKey: queryKeys.generationSettings.detail(),
    queryFn: async () => {
      const segment = api['generation-settings'] as EdenRouteSegment;
      const { data, error } = await segment.get();
      if (error) throw new Error(extractApiError(error, 'Could not load generation settings'));
      return data?.data as GenerationSettings;
    }
  });
}

export function useUpdateGenerationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      model_tier?: 'fast' | 'balanced' | 'best';
      bullet_min?: number;
      bullet_max?: number;
      prompts?: Array<{ scope: string; content: string | null }>;
    }) => {
      const segment = api['generation-settings'] as EdenRouteSegment;
      const { data, error } = await segment.put(input);
      if (error) throw new Error(extractApiError(error, 'Could not update generation settings'));
      return data?.data as GenerationSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generationSettings.all });
    }
  });
}
