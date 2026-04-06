import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export type ResumeTheme = 'brilliant-cv' | 'imprecv' | 'modern-cv' | 'linked-cv';

export function useGenerateResumePdf() {
  return useMutation({
    mutationFn: async (input: { jobDescriptionId: string; headlineId: string; theme?: ResumeTheme }) => {
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
    }
  });
}

export function useGenerateResumeContent(jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { additionalPrompt?: string } = {}) => {
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
    }
  });
}
