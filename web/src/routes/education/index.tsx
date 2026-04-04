import { createFileRoute } from '@tanstack/react-router';
import { EducationList } from '@/components/resume/education/EducationList';

export const Route = createFileRoute('/education/')({
  component: EducationPage
});

function EducationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Education</h1>
        <p className="text-muted-foreground text-sm">Manage your education history.</p>
      </div>
      <EducationList />
    </div>
  );
}
