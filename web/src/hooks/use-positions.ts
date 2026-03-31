import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCreatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      ...body
    }: {
      companyId: string;
      title: string;
      start_date: string;
      end_date: string;
      summary: string | null;
      ordinal: number;
    }) => {
      const { data } = await api.resume.companies({ id: companyId }).positions.post(body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      positionId,
      ...body
    }: {
      companyId: string;
      positionId: string;
      title?: string;
      start_date?: string;
      end_date?: string;
      summary?: string | null;
      ordinal?: number;
    }) => {
      await api.resume.companies({ id: companyId }).positions({ positionId }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, positionId }: { companyId: string; positionId: string }) => {
      await api.resume.companies({ id: companyId }).positions({ positionId }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}
