import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useArchetypes() {
  return useQuery({
    queryKey: queryKeys.archetypes.list(),
    queryFn: async () => {
      const { data } = await api.archetypes.get();
      return data?.data ?? [];
    }
  });
}

export function useCreateArchetype() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; label: string }) => {
      const { data } = await api.archetypes.post(input);
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
      key: string;
      label: string;
      headline_id?: string | null;
      headline_text?: string;
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

export function useSetArchetypeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      experience_selections: { experience_id: string; bullet_variant_ids: string[] }[];
      education_ids: string[];
      skill_category_ids: string[];
      skill_item_ids: string[];
    }) => {
      await api.archetypes({ id }).content.put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetypes.all });
    }
  });
}

export function useSetArchetypeTagProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      role_weights: Record<string, number>;
      skill_weights: Record<string, number>;
    }) => {
      await api.archetypes({ id })['tag-profile'].put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetypes.all });
    }
  });
}
