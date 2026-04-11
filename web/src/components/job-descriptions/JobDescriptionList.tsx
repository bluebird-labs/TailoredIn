import { Search, X } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Input } from '@/components/ui/input';
import { useJobDescriptions } from '@/hooks/use-job-descriptions';
import { JobDescriptionCard } from './JobDescriptionCard.js';
import { JobDescriptionFormModal } from './JobDescriptionFormModal.js';

interface JobDescriptionListProps {
  readonly companyId?: string;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly createOpen: boolean;
  readonly onCreateOpenChange: (open: boolean) => void;
}

export function JobDescriptionList({
  companyId,
  search,
  onSearchChange,
  createOpen,
  onCreateOpenChange
}: JobDescriptionListProps) {
  const { data: jobDescriptions = [], isLoading } = useJobDescriptions(companyId);

  const filtered = useMemo(() => {
    if (!search.trim()) return jobDescriptions;
    const q = search.toLowerCase();
    return jobDescriptions.filter(
      jd => jd.title.toLowerCase().includes(q) || jd.companyName?.toLowerCase().includes(q)
    );
  }, [jobDescriptions, search]);

  if (isLoading) return <LoadingSkeleton variant="list" count={3} />;

  return (
    <>
      {jobDescriptions.length === 0 && !createOpen ? (
        <EmptyState
          message="No job descriptions yet."
          actionLabel="Add job description"
          onAction={() => onCreateOpenChange(true)}
        />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search job descriptions..."
              className={search ? 'pl-9 pr-8' : 'pl-9'}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No job descriptions match your search.</p>
          ) : (
            filtered.map(jd => <JobDescriptionCard key={jd.id} jobDescription={jd} showCompany={!companyId} />)
          )}
        </div>
      )}

      {createOpen && (
        <JobDescriptionFormModal
          open
          companyId={companyId}
          onOpenChange={next => {
            if (!next) onCreateOpenChange(false);
          }}
        />
      )}
    </>
  );
}
