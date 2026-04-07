import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export type ResumeTheme = 'brilliant-cv' | 'imprecv' | 'modern-cv' | 'linked-cv';

export function useGenerateResumePdf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { jobDescriptionId: string; theme?: ResumeTheme }) => {
      const response = await fetch('/api/resume/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error((json as { error?: { message?: string } } | null)?.error?.message ?? 'Failed to generate PDF');
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
    mutationFn: async (input: {
      experienceHiddenBullets?: Array<{ experienceId: string; hiddenBulletIndices: number[] }>;
      hiddenEducationIds?: string[];
    }) => {
      const response = await fetch('/api/resume/display-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionId, ...input })
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(
          (json as { error?: { message?: string } } | null)?.error?.message ?? 'Failed to update display settings'
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.cachedPdf(jobDescriptionId) });
    }
  });
}

export type ResumeGenerationScope = { type: 'headline' } | { type: 'experience'; experienceId: string };

export function useGenerateResumeContent(jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { additionalPrompt?: string; scope?: ResumeGenerationScope } = {}) => {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionId, ...input })
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(
          (json as { error?: { message?: string } } | null)?.error?.message ?? 'Failed to generate resume content'
        );
      }
      return response.json() as Promise<{ data: unknown }>;
    },
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
      const response = await fetch(`/api/resume/pdf/${jobDescriptionId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch cached PDF');
      return response.arrayBuffer();
    },
    enabled
  });
}
