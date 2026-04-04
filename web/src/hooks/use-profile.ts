import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty route param types vary
type AnyRouteSegment = any;

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: async () => {
      const { data } = await api.profile.get();
      return data?.data ?? null;
    }
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      first_name: string;
      last_name: string;
      about: string | null;
      phone: string | null;
      location: string | null;
      linkedin_url: string | null;
      github_url: string | null;
      website_url: string | null;
    }) => {
      const segment = api.profile as AnyRouteSegment;
      const { error } = await segment.put(input);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to update profile');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
    }
  });
}
