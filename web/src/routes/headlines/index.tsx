import { createFileRoute } from '@tanstack/react-router';
import { HeadlineList } from '@/components/resume/headlines/HeadlineList';
import { useAggregateDirtyRegistry } from '@/hooks/use-aggregate-dirty-registry.js';
import { useNavGuard } from '@/hooks/use-nav-guard.js';

export const Route = createFileRoute('/headlines/')({
  component: HeadlinesPage
});

function HeadlinesPage() {
  const dirtyRegistry = useAggregateDirtyRegistry();
  useNavGuard({ isDirty: dirtyRegistry.isDirty });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Headlines</h1>
        <p className="text-muted-foreground text-sm">Manage your headline variants.</p>
      </div>
      <HeadlineList onDirtyChange={dirtyRegistry.register} />
    </div>
  );
}
