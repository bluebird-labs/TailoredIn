import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useSkillCategories() {
  return useQuery({
    queryKey: queryKeys.resume.skills(),
    queryFn: async () => {
      const { data } = await api.resume.skills.get();
      return data;
    }
  });
}

export function useCreateSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      category_name: string;
      ordinal: number;
      items?: { skill_name: string; ordinal: number }[];
    }) => {
      const { data } = await api.resume.skills.post(input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skills() });
    }
  });
}

export function useUpdateSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; category_name?: string; ordinal?: number }) => {
      await api.resume.skills({ id }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skills() });
    }
  });
}

export function useDeleteSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.resume.skills({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skills() });
    }
  });
}

export function useAddSkillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      skill_name,
      ordinal
    }: {
      categoryId: string;
      skill_name: string;
      ordinal: number;
    }) => {
      const { data } = await api.resume.skills({ id: categoryId }).items.post({ skill_name, ordinal });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skills() });
    }
  });
}

export function useUpdateSkillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      itemId,
      ...body
    }: {
      categoryId: string;
      itemId: string;
      skill_name?: string;
      ordinal?: number;
    }) => {
      await api.resume.skills({ id: categoryId }).items({ itemId }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skills() });
    }
  });
}

export function useDeleteSkillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ categoryId, itemId }: { categoryId: string; itemId: string }) => {
      await api.resume.skills({ id: categoryId }).items({ itemId }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skills() });
    }
  });
}
