import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';
import { getToken } from '@/lib/auth';
import { queryKeys } from '@/lib/query-keys';

export type ResumeTheme = 'brilliant-cv' | 'imprecv' | 'modern-cv' | 'linked-cv';

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export function useGenerateResumePdf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { jobDescriptionId: string; theme?: ResumeTheme }) => {
      // Binary response — Treaty can't parse PDF, so use authenticated fetch
      const response = await fetch('/api/resume/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
      const segment = api.resume['display-settings'] as EdenRouteSegment;
      const { error } = await segment.patch({ jobDescriptionId, ...input });
      if (error) throw new Error(extractApiError(error, 'Failed to update display settings'));
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
      try {
        await fetch('/api/resume/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ jobDescriptionId })
        });
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
    mutationFn: async (
      input: {
        additionalPrompt?: string;
        customInstructions?: string;
        scope?: ResumeGenerationScope;
        bulletOverrides?: Array<{ experienceId: string; min: number; max: number }>;
      } = {}
    ) => {
      const segment = api.resume.generate as EdenRouteSegment;
      const { data, error } = await segment.post({ jobDescriptionId, ...input });
      if (error) throw new Error(extractApiError(error, 'Failed to generate resume content'));
      return data as { data: unknown };
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
      // Binary response — Treaty can't parse PDF, so use authenticated fetch
      const response = await fetch(`/api/resume/pdf/${jobDescriptionId}`, { headers: authHeaders() });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch cached PDF');
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
