import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FitScore } from '@/hooks/use-job-descriptions';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';

export function useScoreJobFit(jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const segment = api['job-descriptions']({ id: jobDescriptionId })['score-fit'] as EdenRouteSegment;
      const { data, error } = await segment.post();
      if (error) throw new Error(extractApiError(error, 'Failed to score job fit'));
      return (data as { data: FitScore }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
    }
  });
}
