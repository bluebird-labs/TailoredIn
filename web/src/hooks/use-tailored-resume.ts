import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTailoredResume(id: string) {
  return useQuery({
    queryKey: queryKeys.tailoredResumes.detail(id),
    queryFn: async () => {
      const { data } = await api.resumes.tailored({ id }).get();
      return data?.data ?? null;
    },
    enabled: !!id
  });
}

export function useCreateTailoredResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { jd_content: string }) => {
      const { data } = await api.resumes.tailored.post(input);
      return data?.data ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tailoredResumes.all });
    }
  });
}

export function useUpdateTailoredResume(id: string) {
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
      const { data } = await api.resumes.tailored({ id }).put(input);
      return data?.data ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tailoredResumes.detail(id) });
    }
  });
}

export function useGenerateTailoredResumePdf(id: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.resumes.tailored({ id })['generate-pdf'].post();
      return data?.data ?? null;
    }
  });
}
