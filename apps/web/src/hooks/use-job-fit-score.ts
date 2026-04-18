import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FitScore } from '@/hooks/use-job-descriptions';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useScoreJobFit(jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<FitScore>(`/job-descriptions/${jobDescriptionId}/score-fit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
    }
  });
}
