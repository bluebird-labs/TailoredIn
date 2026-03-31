import { JobStatus } from '@tailoredin/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Building2,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Monitor,
  RefreshCw,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ClassificationBadge } from '@/components/companies/classification-badge';
import { JobStatusBadge } from '@/components/jobs/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ARCHETYPE_KEY_LABELS } from '@/hooks/use-archetypes';
import { api } from '@/lib/api';
import { detectAtsPlatform } from '@/lib/ats-platform';
import { DEFAULT_TARGET_SALARY } from '@/lib/constants';
import { isDiscardedStatus } from '@/lib/job-views';
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
  const [selectedArchetype, setSelectedArchetype] = useState('leader_individual_contributor');
  const [keywordsInput, setKeywordsInput] = useState('');

  const { data: configData } = useQuery({
    queryKey: queryKeys.config.capabilities(),
    queryFn: async () => {
      const res = await fetch('/api/config');
      return res.json() as Promise<{ llmAvailable: boolean }>;
    },
    staleTime: Number.POSITIVE_INFINITY
  });
  const llmAvailable = configData?.llmAvailable ?? true;

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
      const fetchOptions: RequestInit = { method: 'PUT' };
      if (!llmAvailable) {
        const keywords = keywordsInput
          .split(',')
          .map(k => k.trim())
          .filter(Boolean);
        fetchOptions.headers = { 'Content-Type': 'application/json' };
        fetchOptions.body = JSON.stringify({ archetype: selectedArchetype, keywords });
      }
      const res = await fetch(`/api/jobs/${jobId}/generate-resume`, fetchOptions);
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

  const job = data as typeof data & {
    company?: {
      id: string;
      name: string;
      website: string | null;
      linkedinLink: string;
      businessType: string | null;
      industry: string | null;
      stage: string | null;
    };
  };
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
            <p className="text-lg text-muted-foreground">
              {job.company ? (
                <Link
                  to="/companies/$companyId"
                  params={{ companyId: job.company.id }}
                  className="hover:text-primary hover:underline"
                >
                  {job.company.name}
                </Link>
              ) : (
                'Unknown Company'
              )}
            </p>
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
              {(() => {
                const platform = detectAtsPlatform(job.applyLink!);
                return platform ? `Apply on ${platform.name}` : 'Apply';
              })()}
            </a>
          )}
        </div>
      </div>

      <Separator />

      {/* Company info */}
      {job.company && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/companies/$companyId"
                params={{ companyId: job.company.id }}
                className="font-medium text-primary hover:underline"
              >
                {job.company.name}
              </Link>
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </a>
              )}
              <span className="text-muted-foreground">|</span>
              <ClassificationBadge label="Type" value={job.company.businessType} />
              <ClassificationBadge label="Industry" value={job.company.industry} />
              <ClassificationBadge label="Stage" value={job.company.stage} />
            </div>
          </CardContent>
        </Card>
      )}

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

        {isDiscardedStatus(job.status) && (
          <Button
            variant="outline"
            onClick={() => statusMutation.mutate(JobStatus.NEW)}
            disabled={statusMutation.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reopen
          </Button>
        )}

        {llmAvailable ? (
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
        ) : (
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="archetype-select">Archetype</Label>
              <Select value={selectedArchetype} onValueChange={v => v && setSelectedArchetype(v)}>
                <SelectTrigger id="archetype-select" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ARCHETYPE_KEY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="keywords-input">Keywords (comma-separated)</Label>
              <Input
                id="keywords-input"
                value={keywordsInput}
                onChange={e => setKeywordsInput(e.target.value)}
                placeholder="react, typescript, aws..."
                className="w-[260px]"
              />
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
        )}
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

      {/* Company Brief */}
      <CompanyBriefPanel jobId={jobId} llmAvailable={llmAvailable} />

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

type CompanyBriefData = {
  id: string;
  companyId: string;
  productOverview: string;
  techStack: string;
  culture: string;
  recentNews: string;
  keyPeople: string;
  createdAt: string;
  updatedAt: string;
};

function CompanyBriefPanel({ jobId, llmAvailable }: { jobId: string; llmAvailable: boolean }) {
  const queryClient = useQueryClient();

  const { data: briefData, isLoading } = useQuery({
    queryKey: queryKeys.jobs.brief(jobId),
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/brief`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<{ data: CompanyBriefData | null }>;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/generate-brief`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<{ data: CompanyBriefData }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.brief(jobId) });
      toast.success('Company brief generated');
    },
    onError: (err: Error) => {
      toast.error(`Failed to generate brief: ${err.message}`);
    }
  });

  if (!llmAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Company Brief
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Company briefs require an OpenAI API key.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const brief = briefData?.data;

  if (!brief) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Company Brief
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} variant="outline">
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Company Brief
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Company Brief
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <BriefSection title="Product Overview" content={brief.productOverview} />
        <BriefSection title="Tech Stack" content={brief.techStack} />
        <BriefSection title="Culture" content={brief.culture} />
        <BriefSection title="Recent News" content={brief.recentNews} />
        <BriefSection title="Key People" content={brief.keyPeople} />
      </CardContent>
    </Card>
  );
}

function BriefSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground whitespace-pre-line">{content}</p>
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
