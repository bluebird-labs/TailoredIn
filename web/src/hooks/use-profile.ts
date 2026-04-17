import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  about: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
};

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: () => api.get<Profile>('/profile')
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      email: string;
      first_name: string;
      last_name: string;
      about: string | null;
      phone: string | null;
      location: string | null;
      linkedin_url: string | null;
      github_url: string | null;
      website_url: string | null;
    }) => api.put('/profile', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
    }
  });
}
