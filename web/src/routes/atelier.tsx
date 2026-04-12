import { createFileRoute, retainSearchParams, useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { AtelierRightPanel, type AtelierTab } from '@/components/atelier/AtelierRightPanel.js';
import { GenerationWorkspace } from '@/components/atelier/GenerationWorkspace.js';
import { persistSearchParams, useSearchPersistence } from '@/lib/persisted-search.js';

type AtelierSearch = { job?: string };

export const Route = createFileRoute('/atelier')({
  component: AtelierPage,
  validateSearch: (search: Record<string, unknown>): AtelierSearch => ({
    job: typeof search.job === 'string' ? search.job : undefined
  }),
  search: {
    middlewares: [persistSearchParams<AtelierSearch>('/atelier', ['job']), retainSearchParams(['job'])]
  }
});

function AtelierPage() {
  const search = Route.useSearch();
  useSearchPersistence('/atelier', search, ['job']);
  const { job: selectedJobId } = search;
  const navigate = useNavigate();
  const [rightTab, setRightTab] = useState<AtelierTab>('pdf');

  const setSelectedJobId = useCallback(
    (id: string | null) => {
      navigate({ to: '/atelier', search: id ? { job: id } : {}, replace: true });
    },
    [navigate]
  );

  return (
    <div className="-mx-9 -my-8 flex" style={{ height: 'calc(100vh)' }}>
      <GenerationWorkspace
        selectedJobId={selectedJobId ?? null}
        onSelectJob={setSelectedJobId}
        onScoreComplete={() => setRightTab('score')}
      />
      <AtelierRightPanel selectedJobId={selectedJobId ?? null} activeTab={rightTab} onTabChange={setRightTab} />
    </div>
  );
}
