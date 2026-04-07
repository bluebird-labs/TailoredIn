import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { AtelierPdfPreview } from '@/components/atelier/AtelierPdfPreview.js';
import { GenerationSettingsPanel } from '@/components/atelier/GenerationSettingsPanel.js';
import { GenerationWorkspace } from '@/components/atelier/GenerationWorkspace.js';

export const Route = createFileRoute('/atelier')({
  component: AtelierPage
});

function AtelierPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  return (
    <div className="-mx-9 -my-8 flex" style={{ height: 'calc(100vh)' }}>
      <GenerationSettingsPanel />
      <GenerationWorkspace selectedJobId={selectedJobId} onSelectJob={setSelectedJobId} />
      <AtelierPdfPreview selectedJobId={selectedJobId} />
    </div>
  );
}
