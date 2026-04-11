import { createFileRoute } from '@tanstack/react-router';
import { KanbanSquare, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApplicationBoard } from '@/components/applications/ApplicationBoard';
import { BoardSkeleton } from '@/components/applications/BoardSkeleton';
import { CreateApplicationModal } from '@/components/applications/CreateApplicationModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApplications } from '@/hooks/use-applications';
import { useCompanies } from '@/hooks/use-companies';
import { useJobDescriptions } from '@/hooks/use-job-descriptions';
import { useProfile } from '@/hooks/use-profile';

export const Route = createFileRoute('/applications/')({
  component: ApplicationsPage
});

function ApplicationsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: profile } = useProfile();
  const profileId = profile?.id ?? '';

  const { data: applications = [], isLoading: loadingApplications } = useApplications(profileId);
  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const { data: jobDescriptions = [], isLoading: loadingJobs } = useJobDescriptions();

  const isLoading = loadingApplications || loadingCompanies || loadingJobs;

  const isEmpty = useMemo(() => !isLoading && applications.length === 0, [isLoading, applications.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-heading">Applications</h1>
          <p className="text-sm text-muted-foreground">Track your job applications across every stage.</p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && applications.length > 0 && <Badge variant="secondary">{applications.length}</Badge>}
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add application
          </Button>
        </div>
      </div>

      {isLoading ? (
        <BoardSkeleton />
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <KanbanSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h2 className="text-lg font-medium">No applications yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first application to start tracking your job search.
          </p>
        </div>
      ) : (
        <ApplicationBoard applications={applications} companies={companies} jobDescriptions={jobDescriptions} />
      )}

      <CreateApplicationModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        profileId={profileId}
        jobDescriptions={jobDescriptions}
        applications={applications}
      />
    </div>
  );
}
