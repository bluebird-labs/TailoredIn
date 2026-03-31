import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

type UrlInput = { mode: 'url'; url: string };
type ManualInput = {
  mode: 'manual';
  fields: {
    jobTitle: string;
    companyName: string;
    companyLink: string;
    location: string;
    description: string;
    descriptionHtml: string;
    companyLogoUrl?: string;
    salary?: string | null;
    jobType?: string | null;
    remote?: string | null;
    posted?: string | null;
    jobLevel?: string | null;
    applicants?: string | null;
    applyLink?: string | null;
    companyWebsite?: string | null;
  };
};

type AddJobInput = UrlInput | ManualInput;

export function useAddJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddJobInput) => {
      // biome-ignore lint/suspicious/noExplicitAny: Eden Treaty type doesn't match Elysia's union schema
      const res = await api.jobs.post(input as any);
      if (res.error) {
        const err = res.error as { error?: string; message?: string };
        if (err.error === 'INVALID_URL') throw new Error(err.message ?? 'Invalid LinkedIn URL');
        if (err.error === 'SCRAPE_FAILED') throw new Error(err.message ?? 'Failed to scrape job posting');
        throw new Error(String(res.error));
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      toast.success('Job added successfully');
    },
    onError: (err: Error) => {
      toast.error(`Failed to add job: ${err.message}`);
    }
  });
}
