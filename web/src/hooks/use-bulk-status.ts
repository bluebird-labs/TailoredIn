import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useBulkChangeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { jobIds: string[]; status: string }) => {
      const res = await api.jobs['bulk-status'].put({
        job_ids: input.jobIds,
        // biome-ignore lint/suspicious/noExplicitAny: Eden Treaty enum type mismatch
        status: input.status as any
      });
      if (res.error) throw new Error(String(res.error));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    }
  });
}
