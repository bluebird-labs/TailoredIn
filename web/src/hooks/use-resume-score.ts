import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResumeScore } from '@/hooks/use-job-descriptions';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useScoreResume(resumeContentId: string, jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ResumeScore>(`/resume/${resumeContentId}/score`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
    }
  });
}
