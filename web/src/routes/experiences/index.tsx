import { createFileRoute } from '@tanstack/react-router';
import { ExperienceList } from '@/components/resume/experience/ExperienceList';

export const Route = createFileRoute('/experiences/')({
  component: ExperiencesPage
});

function ExperiencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Experiences</h1>
        <p className="text-muted-foreground text-sm">Manage your work experiences and accomplishments.</p>
      </div>
      <ExperienceList />
    </div>
  );
}
