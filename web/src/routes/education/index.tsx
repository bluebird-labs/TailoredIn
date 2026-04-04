import { createFileRoute } from '@tanstack/react-router';
import { EducationList } from '@/components/resume/education/EducationList';
import { useAggregateDirtyRegistry } from '@/hooks/use-aggregate-dirty-registry.js';
import { useNavGuard } from '@/hooks/use-nav-guard.js';

export const Route = createFileRoute('/education/')({
  component: EducationPage
});

function EducationPage() {
  const dirtyRegistry = useAggregateDirtyRegistry();
  useNavGuard({ isDirty: dirtyRegistry.isDirty });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Education</h1>
        <p className="text-muted-foreground text-sm">Manage your education history.</p>
      </div>
      <EducationList onDirtyChange={dirtyRegistry.register} />
    </div>
  );
}
