import { createFileRoute } from '@tanstack/react-router';
import { HeadlineList } from '@/components/resume/headlines/HeadlineList';
import { EditableSectionProvider } from '@/components/shared/EditableSectionContext.js';

export const Route = createFileRoute('/headlines/')({
  component: HeadlinesPage
});

function HeadlinesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Headlines</h1>
        <p className="text-muted-foreground text-sm">Manage your headlines.</p>
      </div>
      <EditableSectionProvider>
        <HeadlineList />
      </EditableSectionProvider>
    </div>
  );
}
