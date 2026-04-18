import { createFileRoute, retainSearchParams, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { CompanyList } from '@/components/companies/CompanyList';
import { Button } from '@/components/ui/button';
import { clearStoredSearch, persistSearchParams, useSearchPersistence } from '@/lib/persisted-search.js';

type CompaniesSearch = { search?: string };

export const Route = createFileRoute('/companies/')({
  component: CompaniesPage,
  validateSearch: (search: Record<string, unknown>): CompaniesSearch => ({
    search: typeof search.search === 'string' ? search.search : undefined
  }),
  search: {
    middlewares: [persistSearchParams<CompaniesSearch>('/companies', ['search']), retainSearchParams(['search'])]
  }
});

function CompaniesPage() {
  const searchParams = Route.useSearch();
  useSearchPersistence('/companies', searchParams, ['search']);
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const setSearch = useCallback(
    (value: string) => {
      if (!value) clearStoredSearch('/companies');
      navigate({ to: '/companies', search: { search: value || undefined }, replace: true });
    },
    [navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-heading">Companies</h1>
          <p className="text-muted-foreground text-sm">View and manage your company directory.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add company
        </Button>
      </div>
      <CompanyList
        search={searchParams.search ?? ''}
        onSearchChange={setSearch}
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
      />
    </div>
  );
}
