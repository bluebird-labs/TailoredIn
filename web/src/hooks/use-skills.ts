import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useSkillCategories() {
  return useQuery({
    queryKey: queryKeys.resume.skillCategories(),
    queryFn: async () => {
      const { data } = await api['skill-categories'].get();
      return data?.data ?? [];
    }
  });
}

export function useCreateSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; ordinal: number; items?: { name: string; ordinal: number }[] }) => {
      const { data } = await api['skill-categories'].post(input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useUpdateSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; ordinal?: number }) => {
      await api['skill-categories']({ id }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useDeleteSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api['skill-categories']({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useAddSkillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ categoryId, name, ordinal }: { categoryId: string; name: string; ordinal: number }) => {
      const { data } = await api['skill-categories']({ id: categoryId }).items.post({ name, ordinal });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useUpdateSkillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, ...body }: { itemId: string; name?: string; ordinal?: number }) => {
      await api['skill-items']({ id: itemId }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useDeleteSkillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api['skill-items']({ id: itemId }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}
