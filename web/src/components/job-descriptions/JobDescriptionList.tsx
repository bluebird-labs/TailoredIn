import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type JobDescription, useJobDescriptions } from '@/hooks/use-job-descriptions';
import { JobDescriptionCard } from './JobDescriptionCard.js';
import { JobDescriptionFormModal } from './JobDescriptionFormModal.js';

interface JobDescriptionListProps {
  readonly companyId: string;
}

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; jobDescription: JobDescription };

export function JobDescriptionList({ companyId }: JobDescriptionListProps) {
  const { data: jobDescriptions = [], isLoading } = useJobDescriptions(companyId);
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return jobDescriptions;
    const q = search.toLowerCase();
    return jobDescriptions.filter(jd => jd.title.toLowerCase().includes(q));
  }, [jobDescriptions, search]);

  if (isLoading) return <LoadingSkeleton variant="list" count={3} />;

  const modalOpen = modalState.mode !== 'closed';

  return (
    <>
      {jobDescriptions.length === 0 && !modalOpen ? (
        <EmptyState
          message="No job descriptions yet."
          actionLabel="Add job description"
          onAction={() => setModalState({ mode: 'create' })}
        />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search job descriptions..."
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No job descriptions match your search.</p>
          ) : (
            filtered.map(jd => (
              <JobDescriptionCard
                key={jd.id}
                jobDescription={jd}
                onClick={() => setModalState({ mode: 'edit', jobDescription: jd })}
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
            Add job description
          </Button>
        </div>
      )}

      {modalState.mode === 'create' && (
        <JobDescriptionFormModal
          open
          companyId={companyId}
          onOpenChange={next => {
            if (!next) setModalState({ mode: 'closed' });
          }}
        />
      )}
      {modalState.mode === 'edit' && (
        <JobDescriptionFormModal
          open
          companyId={companyId}
          jobDescription={modalState.jobDescription}
          onOpenChange={next => {
            if (!next) setModalState({ mode: 'closed' });
          }}
        />
      )}
    </>
  );
}
