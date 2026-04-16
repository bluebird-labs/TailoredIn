import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResumeScore } from '@/hooks/use-job-descriptions';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';

export function useScoreResume(resumeContentId: string, jobDescriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const segment = api.resume({ id: resumeContentId }).score as EdenRouteSegment;
      const { data, error } = await segment.post();
      if (error) throw new Error(extractApiError(error, 'Failed to score resume'));
      return (data as { data: ResumeScore }).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobDescriptions.detail(jobDescriptionId) });
    }
  });
}
