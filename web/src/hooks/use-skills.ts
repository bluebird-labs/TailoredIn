import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import type { Experience } from './use-experiences';

export type Skill = {
  id: string;
  label: string;
  type: string;
  categoryId: string | null;
  category: { id: string; label: string } | null;
  description: string | null;
};

export function useSearchSkills(query: string) {
  return useQuery({
    queryKey: queryKeys.skills.search(query),
    queryFn: async () => {
      const { data, error } = await api.skills.get({ query: { q: query, limit: 20 } });
      if (error) throw new Error(extractApiError(error as EdenRouteSegment, 'Could not search skills'));
      return (data?.data ?? []) as Skill[];
    },
    enabled: query.trim().length > 0
  });
}

export function useSyncExperienceSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { experienceId: string; skillIds: string[] }) => {
      const segment = api.experiences as EdenRouteSegment;
      const { data, error } = await segment({ id: input.experienceId }).skills.put({
        skill_ids: input.skillIds
      });
      if (error) throw new Error(extractApiError(error, 'Could not sync experience skills'));
      return data?.data as Experience;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}
