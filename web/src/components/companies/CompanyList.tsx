import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Company, useCompanies } from '@/hooks/use-companies';
import { CompanyCard } from './CompanyCard.js';
import { CompanyFormModal } from './CompanyFormModal.js';

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; company: Company };

export function CompanyList() {
  const { data: companies = [], isLoading } = useCompanies();
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(q));
  }, [companies, search]);

  if (isLoading) return <LoadingSkeleton variant="list" count={3} />;

  const modalOpen = modalState.mode !== 'closed';

  return (
    <>
      {companies.length === 0 && !modalOpen ? (
        <EmptyState
          message="No companies yet."
          actionLabel="Add company"
          onAction={() => setModalState({ mode: 'create' })}
        />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No companies match your search.</p>
          ) : (
            filtered.map(company => (
              <CompanyCard
                key={company.id}
                company={company}
                onClick={() => setModalState({ mode: 'edit', company })}
              />
            ))
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => setModalState({ mode: 'create' })}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add company
          </Button>
        </div>
      )}

      {modalState.mode === 'create' && (
        <CompanyFormModal
          open
          onOpenChange={next => {
            if (!next) setModalState({ mode: 'closed' });
          }}
        />
      )}
      {modalState.mode === 'edit' && (
        <CompanyFormModal
          open
          company={modalState.company}
          onOpenChange={next => {
            if (!next) setModalState({ mode: 'closed' });
          }}
        />
      )}
    </>
  );
}
