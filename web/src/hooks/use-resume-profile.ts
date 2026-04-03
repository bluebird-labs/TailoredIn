import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useResumeProfile() {
  return useQuery({
    queryKey: queryKeys.resumeProfile.detail(),
    queryFn: async () => {
      const { data } = await api.resume.profile.get();
      return data?.data ?? null;
    }
  });
}

export function useUpdateResumeProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      content_selection: {
        experience_selections: { experience_id: string; accomplishment_ids: string[] }[];
        project_ids: string[];
        education_ids: string[];
        skill_category_ids: string[];
        skill_item_ids: string[];
      };
      headline_text: string;
    }) => {
      const { data } = await api.resume.profile.put(input);
      return data?.data ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumeProfile.all });
    }
  });
}

export function useGenerateResumeProfilePdf() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.resume.profile['generate-pdf'].post();
      return data?.data ?? null;
    }
  });
}
