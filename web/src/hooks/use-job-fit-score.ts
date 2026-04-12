import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FitScore } from '@/hooks/use-job-descriptions';
import { queryKeys } from '@/lib/query-keys';

async function tryParseErrorBody(response: Response): Promise<string | null> {
  try {
    const json = (await response.json()) as { error?: { message?: string } };
    return json?.error?.message ?? null;
  } catch {
    return null;
  }
}

export function useScoreJobFit(jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/job-descriptions/${jobDescriptionId}/score-fit`, {
        method: 'POST'
      });
      if (!response.ok) {
        const message = await tryParseErrorBody(response);
        throw new Error(message ?? 'Failed to score job fit');
      }
      const json = (await response.json()) as { data: FitScore };
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
    }
  });
}
