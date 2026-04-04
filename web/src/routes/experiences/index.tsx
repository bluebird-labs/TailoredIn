import { createFileRoute } from '@tanstack/react-router';
import { ExperienceList } from '@/components/resume/experience/ExperienceList';
import { useAggregateDirtyRegistry } from '@/hooks/use-aggregate-dirty-registry.js';
import { useNavGuard } from '@/hooks/use-nav-guard.js';

export const Route = createFileRoute('/experiences/')({
  component: ExperiencesPage
});

function ExperiencesPage() {
  const dirtyRegistry = useAggregateDirtyRegistry();
  useNavGuard({ isDirty: dirtyRegistry.isDirty });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Experiences</h1>
        <p className="text-muted-foreground text-sm">Manage your work experiences and accomplishments.</p>
      </div>
      <ExperienceList onDirtyChange={dirtyRegistry.register} />
    </div>
  );
}
