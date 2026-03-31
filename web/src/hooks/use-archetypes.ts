import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type ArchetypeKey =
  | 'hands_on_manager'
  | 'high_level_manager'
  | 'individual_contributor'
  | 'leader_individual_contributor'
  | 'nerd';

export const ARCHETYPE_KEY_LABELS: Record<string, string> = {
  hands_on_manager: 'Hands-On Manager',
  high_level_manager: 'Leader/Manager',
  individual_contributor: 'Individual Contributor',
  leader_individual_contributor: 'Lead IC',
  nerd: 'Nerd'
};

export function useArchetypes() {
  return useQuery({
    queryKey: queryKeys.archetypes.list(),
    queryFn: async () => {
      const { data } = await api.archetypes.get();
      return data;
    }
  });
}

export function useCreateArchetype() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      archetype_key: ArchetypeKey;
      archetype_label: string;
      archetype_description: string | null;
      headline_id: string;
      social_networks: string[];
    }) => {
      // Cast archetype_key to satisfy Eden Treaty's enum type from @tailoredin/domain
      const { data } = await api.archetypes.post(input as Parameters<typeof api.archetypes.post>[0]);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetypes.all });
    }
  });
}

export function useUpdateArchetype() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      archetype_label?: string;
      archetype_description?: string | null;
      headline_id?: string;
      social_networks?: string[];
    }) => {
      await api.archetypes({ id }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetypes.all });
    }
  });
}

export function useDeleteArchetype() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.archetypes({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetypes.all });
    }
  });
}

export function useSetArchetypePositions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      positions
    }: {
      id: string;
      positions: {
        resume_position_id: string;
        job_title: string | null;
        display_company_name: string;
        location_label: string;
        start_date: string | null;
        end_date: string | null;
        role_summary: string | null;
        ordinal: number;
        bullets: { bullet_id: string; ordinal: number }[];
      }[];
    }) => {
      await api.archetypes({ id }).positions.put({ positions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetypes.all });
    }
  });
}

export function useSetArchetypeSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      category_selections,
      item_selections
    }: {
      id: string;
      category_selections: { category_id: string; ordinal: number }[];
      item_selections: { item_id: string; ordinal: number }[];
    }) => {
      await api.archetypes({ id }).skills.put({ category_selections, item_selections });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetypes.all });
    }
  });
}

export function useSetArchetypeEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, selections }: { id: string; selections: { education_id: string; ordinal: number }[] }) => {
      await api.archetypes({ id }).education.put({ selections });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetypes.all });
    }
  });
}
