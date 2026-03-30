import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.resume.companies(),
    queryFn: async () => {
      const { data } = await api.resume.companies.get();
      return data;
    }
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      company_name: string;
      company_mention: string | null;
      website_url: string | null;
      business_domain: string;
      joined_at: string;
      left_at: string;
      promoted_at: string | null;
      locations: { label: string; ordinal: number }[];
      bullets: { content: string; ordinal: number }[];
    }) => {
      const { data } = await api.resume.companies.post(input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      company_name?: string;
      company_mention?: string | null;
      website_url?: string | null;
      business_domain?: string;
      joined_at?: string;
      left_at?: string;
      promoted_at?: string | null;
    }) => {
      await api.resume.companies({ id }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.resume.companies({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}

export function useAddBullet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, content, ordinal }: { companyId: string; content: string; ordinal: number }) => {
      const { data } = await api.resume.companies({ id: companyId }).bullets.post({ content, ordinal });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}

export function useUpdateBullet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      bulletId,
      ...body
    }: {
      companyId: string;
      bulletId: string;
      content?: string;
      ordinal?: number;
    }) => {
      await api.resume.companies({ id: companyId }).bullets({ bulletId }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}

export function useDeleteBullet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, bulletId }: { companyId: string; bulletId: string }) => {
      await api.resume.companies({ id: companyId }).bullets({ bulletId }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}

export function useReplaceLocations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      locations
    }: {
      companyId: string;
      locations: { label: string; ordinal: number }[];
    }) => {
      await api.resume.companies({ id: companyId }).locations.put({ locations });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.companies() });
    }
  });
}
