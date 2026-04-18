import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type Application = {
  id: string;
  profileId: string;
  companyId: string;
  status: string;
  jobDescriptionId: string | null;
  notes: string | null;
  archiveReason: string | null;
  withdrawReason: string | null;
  appliedAt: string;
  updatedAt: string;
};

export function useApplications(profileId: string) {
  return useQuery({
    queryKey: queryKeys.applications.list(),
    queryFn: () => api.get<Application[]>('/applications', { profile_id: profileId }),
    enabled: !!profileId
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      profile_id: string;
      company_id: string;
      job_description_id?: string | null;
      notes?: string | null;
    }) => api.post<Application>('/applications', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    }
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; status: string; archiveReason?: string; withdrawReason?: string }) =>
      api.patch<Application>(`/applications/${input.id}/status`, {
        status: input.status,
        archive_reason: input.archiveReason,
        withdraw_reason: input.withdrawReason
      }),
    onMutate: async input => {
      await queryClient.cancelQueries({ queryKey: queryKeys.applications.list() });

      const previous = queryClient.getQueryData<Application[]>(queryKeys.applications.list());

      queryClient.setQueryData<Application[]>(queryKeys.applications.list(), old =>
        old?.map(app =>
          app.id === input.id
            ? {
                ...app,
                status: input.status,
                archiveReason: input.archiveReason ?? null,
                withdrawReason: input.withdrawReason ?? null
              }
            : app
        )
      );

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.applications.list(), context.previous);
      }
      toast.error('Could not update application status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    }
  });
}
