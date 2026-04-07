import { createFileRoute } from '@tanstack/react-router';
import { JobDescriptionList } from '@/components/job-descriptions/JobDescriptionList';

export const Route = createFileRoute('/jobs/')({
  component: JobsPage
});

function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Jobs</h1>
        <p className="text-muted-foreground text-sm">Browse and manage all job descriptions across companies.</p>
      </div>
      <JobDescriptionList />
    </div>
  );
}
