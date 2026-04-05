import { createFileRoute } from '@tanstack/react-router';
import { EducationList } from '@/components/resume/education/EducationList';
import { EditableSectionProvider } from '@/components/shared/EditableSectionContext.js';

export const Route = createFileRoute('/education/')({
  component: EducationPage
});

function EducationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Education</h1>
        <p className="text-muted-foreground text-sm">Manage your education history.</p>
      </div>
      <EditableSectionProvider>
        <EducationList />
      </EditableSectionProvider>
    </div>
  );
}
