import { createFileRoute, retainSearchParams, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { AtelierPdfPreview } from '@/components/atelier/AtelierPdfPreview.js';
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

  const setSelectedJobId = useCallback(
    (id: string | null) => {
      navigate({ to: '/atelier', search: id ? { job: id } : {}, replace: true });
    },
    [navigate]
  );

  return (
    <div className="-mx-9 -my-8 flex" style={{ height: 'calc(100vh)' }}>
      <GenerationWorkspace selectedJobId={selectedJobId ?? null} onSelectJob={setSelectedJobId} />
      <AtelierPdfPreview selectedJobId={selectedJobId ?? null} />
    </div>
  );
}
