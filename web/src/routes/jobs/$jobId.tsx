import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/jobs/$jobId')({
  component: JobDetailPage
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  return (
    <div>
      <h1 className="text-2xl font-bold">Job Detail</h1>
      <p className="text-muted-foreground mt-2">Details for job {jobId}.</p>
    </div>
  );
}
