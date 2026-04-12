import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResumeScore } from '@/hooks/use-job-descriptions';
import { queryKeys } from '@/lib/query-keys';

async function tryParseErrorBody(response: Response): Promise<string | null> {
  try {
    const json = (await response.json()) as { error?: { message?: string } };
    return json?.error?.message ?? null;
  } catch {
    return null;
  }
}

export function useScoreResume(resumeContentId: string, jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/resume/${resumeContentId}/score`, {
        method: 'POST'
      });
      if (!response.ok) {
        const message = await tryParseErrorBody(response);
        throw new Error(message ?? 'Failed to score resume');
      }
      const json = (await response.json()) as { data: ResumeScore };
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
    }
  });
}
