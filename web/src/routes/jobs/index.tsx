import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/jobs/')({
  component: JobsPage
});

function JobsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Jobs</h1>
      <p className="text-muted-foreground mt-2">Ranked job postings will appear here.</p>
    </div>
  );
}
