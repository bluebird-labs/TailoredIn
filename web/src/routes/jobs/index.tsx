import { createFileRoute, retainSearchParams, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { JobDescriptionList } from '@/components/job-descriptions/JobDescriptionList';
import { Button } from '@/components/ui/button';
import { persistSearchParams, useSearchPersistence } from '@/lib/persisted-search.js';

type JobsSearch = { search?: string; company?: string };

export const Route = createFileRoute('/jobs/')({
  component: JobsPage,
  validateSearch: (search: Record<string, unknown>): JobsSearch => ({
    search: typeof search.search === 'string' ? search.search : undefined,
    company: typeof search.company === 'string' ? search.company : undefined
  }),
  search: {
    middlewares: [persistSearchParams<JobsSearch>('/jobs', ['search']), retainSearchParams(['search', 'company'])]
  }
});

function JobsPage() {
  const searchParams = Route.useSearch();
  useSearchPersistence('/jobs', searchParams, ['search']);
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const setSearch = useCallback(
    (value: string) => {
      navigate({ to: '/jobs', search: value ? { search: value } : {}, replace: true });
    },
    [navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-heading">Jobs</h1>
          <p className="text-muted-foreground text-sm">Browse and manage all job descriptions across companies.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add job description
        </Button>
      </div>
      <JobDescriptionList
        companyId={searchParams.company}
        search={searchParams.search ?? ''}
        onSearchChange={setSearch}
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
      />
    </div>
  );
}
