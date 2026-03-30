import { JobStatus } from '@tailoredin/domain/web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  DollarSign,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Monitor
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { JobStatusBadge } from '@/components/jobs/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { DEFAULT_TARGET_SALARY } from '@/lib/constants';
import { queryKeys } from '@/lib/query-keys';

export const Route = createFileRoute('/jobs/$jobId')({
  component: JobDetailPage
});

const FUNNEL_STATUSES = [
  { value: JobStatus.NEW, label: 'New' },
  { value: JobStatus.LATER, label: 'Later' },
  { value: JobStatus.APPLIED, label: 'Applied' },
  { value: JobStatus.RECRUITER_SCREEN, label: 'Recruiter Screen' },
  { value: JobStatus.TECHNICAL_SCREEN, label: 'Technical Screen' },
  { value: JobStatus.HM_SCREEN, label: 'HM Screen' },
  { value: JobStatus.ON_SITE, label: 'On-site' },
  { value: JobStatus.OFFER, label: 'Offer' },
  { value: JobStatus.REJECTED, label: 'Rejected' },
  { value: JobStatus.NO_NEWS, label: 'No News' },
  { value: JobStatus.UNFIT, label: 'Unfit' },
  { value: JobStatus.EXPIRED, label: 'Expired' },
  { value: JobStatus.LOW_SALARY, label: 'Low Salary' }
] as const;

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: async () => {
      const res = await api.jobs({ id: jobId }).get({
        query: { target_salary: DEFAULT_TARGET_SALARY }
      });
      if (res.error) throw new Error(String(res.error));
      return res.data.data;
    }
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: JobStatus) => {
      const res = await api.jobs({ id: jobId }).status.put({ status: newStatus });
      if (res.error) throw new Error(String(res.error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      toast.success('Status updated');
    },
    onError: (err: Error) => {
      toast.error(`Failed to update status: ${err.message}`);
    }
  });

  const handleGenerateResume = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/generate-resume`, { method: 'PUT' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${jobId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Resume downloaded');
    } catch (err) {
      toast.error(`Failed to generate resume: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Job not found.</p>
        <Link to={'/jobs' as string} className="text-primary hover:underline mt-2 inline-block">
          Back to jobs
        </Link>
      </div>
    );
  }

  const job = data as typeof data & { companyName?: string };
  const scores = job.scores;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        to={'/jobs' as string}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-lg text-muted-foreground">{job.companyName ?? 'Unknown Company'}</p>
          </div>
          <JobStatusBadge status={job.status} />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {job.locationRaw && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.locationRaw}
            </span>
          )}
          {job.salaryRaw && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {job.salaryRaw}
            </span>
          )}
          {job.remote && (
            <span className="flex items-center gap-1">
              <Monitor className="h-3.5 w-3.5" />
              {job.remote}
            </span>
          )}
          {job.type && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {job.type}
            </span>
          )}
          {job.postedAt && (
            <span>Posted {formatDistanceToNow(new Date(String(job.postedAt)), { addSuffix: true })}</span>
          )}
        </div>

        {/* Links */}
        <div className="flex items-center gap-3">
          {job.linkedinLink && (
            <a
              href={job.linkedinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              LinkedIn
            </a>
          )}
          {job.applyLink && (
            <a
              href={job.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Apply
            </a>
          )}
        </div>
      </div>

      <Separator />

      {/* Controls row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select
            value={job.status}
            onValueChange={value => statusMutation.mutate(value as JobStatus)}
            disabled={statusMutation.isPending}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FUNNEL_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerateResume} disabled={isGenerating} variant="default">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Resume
            </>
          )}
        </Button>
      </div>

      {/* Scores */}
      {scores && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ScoreItem label="Expert" value={scores.skills.expert?.score ?? 0} />
              <ScoreItem label="Interest" value={scores.skills.interest?.score ?? 0} />
              <ScoreItem label="Avoid" value={scores.skills.avoid?.score ?? 0} />
              <ScoreItem label="Salary" value={scores.salary} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is from LinkedIn scraper, rendered for the self-hosted user
            // biome-ignore lint/style/useNamingConvention: React API requires __html key
            dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreItem({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value ?? '—'}</p>
    </div>
  );
}
