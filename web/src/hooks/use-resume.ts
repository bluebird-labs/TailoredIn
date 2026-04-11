import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export type ResumeTheme = 'brilliant-cv' | 'imprecv' | 'modern-cv' | 'linked-cv';

async function tryParseErrorBody(response: Response): Promise<string | null> {
  try {
    const json = (await response.json()) as { error?: { message?: string } };
    return json?.error?.message ?? null;
  } catch (parseError) {
    // biome-ignore lint/suspicious/noConsole: intentional error reporting for debugging non-JSON error responses
    console.error('Failed to parse error response body:', parseError);
    return null;
  }
}

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
        const message = await tryParseErrorBody(response);
        throw new Error(message ?? 'Failed to generate PDF');
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
        const message = await tryParseErrorBody(response);
        throw new Error(message ?? 'Failed to update display settings');
      }
      return response.json();
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
      // Regenerate the PDF with updated visibility, then refresh the cached PDF query
      try {
        await fetch('/api/resume/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescriptionId })
        });
      } catch {
        // PDF regeneration is best-effort
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.cachedPdf(jobDescriptionId) });
    }
  });
}

type ResumeGenerationScope = { type: 'headline' } | { type: 'experience'; experienceId: string };

export function useGenerateResumeContent(jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: {
        additionalPrompt?: string;
        customInstructions?: string;
        scope?: ResumeGenerationScope;
        bulletOverrides?: Array<{ experienceId: string; min: number; max: number }>;
      } = {}
    ) => {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionId, ...input })
      });
      if (!response.ok) {
        const message = await tryParseErrorBody(response);
        throw new Error(message ?? 'Failed to generate resume content');
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
