import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type ResumeTheme = 'brilliant-cv' | 'imprecv' | 'modern-cv' | 'linked-cv';

export function useGenerateResumePdf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { jobDescriptionId: string; theme?: ResumeTheme }) => {
      const response = await api.postRaw('/resume/pdf', input);
      if (!response.ok) {
        const message = await tryParseErrorBody(response);
        throw new ApiError(response.status, 'PDF_GENERATION_FAILED', message ?? 'Failed to generate PDF');
      }
      return response.arrayBuffer();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.cachedPdf(variables.jobDescriptionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(variables.jobDescriptionId) });
    }
  });
}

export function useUpdateResumeDisplaySettings(jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      experienceHiddenBullets?: Array<{ experienceId: string; hiddenBulletIndices: number[] }>;
      hiddenEducationIds?: string[];
    }) => api.patch('/resume/display-settings', { jobDescriptionId, ...input }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
      try {
        await api.postRaw('/resume/pdf', { jobDescriptionId });
      } catch {
        // PDF regeneration is best-effort
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.cachedPdf(jobDescriptionId) });
    }
  });
}

type ResumeGenerationScope =
  | { type: 'headline' }
  | { type: 'experience'; experienceId: string }
  | { type: 'summary'; experienceId: string }
  | { type: 'bullet'; experienceId: string; bulletIndex: number; instructions: string };

export function useGenerateResumeContent(jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: {
        additionalPrompt?: string;
        customInstructions?: string;
        scope?: ResumeGenerationScope;
        bulletOverrides?: Array<{ experienceId: string; min: number; max: number }>;
      } = {}
    ) => api.post('/resume/generate', { jobDescriptionId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.cachedPdf(jobDescriptionId) });
    }
  });
}

export function useCachedResumePdf(jobDescriptionId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.resume.cachedPdf(jobDescriptionId),
    queryFn: async () => {
      const response = await api.getRaw(`/resume/pdf/${jobDescriptionId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new ApiError(response.status, 'FETCH_FAILED', 'Failed to fetch cached PDF');
      return response.arrayBuffer();
    },
    enabled
  });
}

async function tryParseErrorBody(response: Response): Promise<string | null> {
  try {
    const json = (await response.json()) as { error?: { message?: string } };
    return json?.error?.message ?? null;
  } catch {
    return null;
  }
}
