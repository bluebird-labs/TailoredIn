import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Experience } from './use-experiences';

export type Skill = {
  id: string;
  label: string;
  kind: string;
  categoryId: string | null;
  category: { id: string; label: string; parentId: string | null } | null;
  description: string | null;
};

export type SkillCategory = {
  id: string;
  label: string;
  parentId: string | null;
};

export function useAllSkills() {
  return useQuery({
    queryKey: queryKeys.skills.list(),
    queryFn: () => api.get<Skill[]>('/skills/all'),
    staleTime: 5 * 60 * 1000
  });
}

export function useSkillCategories() {
  return useQuery({
    queryKey: queryKeys.skills.categories(),
    queryFn: () => api.get<SkillCategory[]>('/skill-categories'),
    staleTime: 5 * 60 * 1000
  });
}

export function useSearchSkills(query: string) {
  return useQuery({
    queryKey: queryKeys.skills.search(query),
    queryFn: () => api.get<Skill[]>('/skills', { q: query, limit: 20 }),
    enabled: query.trim().length > 0
  });
}

export function useSyncExperienceSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { experienceId: string; skillIds: string[] }) =>
      api.put<Experience>(`/experiences/${input.experienceId}/skills`, { skill_ids: input.skillIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}
