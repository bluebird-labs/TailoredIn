import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type GenerationPromptDto = {
  id: string;
  scope: string;
  content: string;
};

export type GenerationSettings = {
  id: string;
  profileId: string;
  modelTier: string;
  bulletMin: number;
  bulletMax: number;
  prompts: GenerationPromptDto[];
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
    queryFn: () => api.get<GenerationSettings>('/generation-settings')
  });
}

export function useUpdateGenerationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      model_tier?: 'fast' | 'balanced' | 'best';
      bullet_min?: number;
      bullet_max?: number;
      prompts?: Array<{ scope: string; content: string | null }>;
    }) => api.put<GenerationSettings>('/generation-settings', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generationSettings.all });
    }
  });
}
