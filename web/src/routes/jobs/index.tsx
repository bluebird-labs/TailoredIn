import { BusinessType, CompanyStage, Industry, JobStatus } from '@tailoredin/api/client';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { formatClassificationLabel } from '@/components/companies/classification-badge';
import { AddJobDialog } from '@/components/jobs/add-job-dialog';
import { JobStatusBadge } from '@/components/jobs/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBulkChangeStatus } from '@/hooks/use-bulk-status';
import { api } from '@/lib/api';
import { DEFAULT_LIMIT, DEFAULT_TARGET_SALARY } from '@/lib/constants';
import { getViewStatuses, JOB_VIEW_CONFIG, JOB_VIEWS, type JobView } from '@/lib/job-views';
import { queryKeys } from '@/lib/query-keys';

const jobSearchSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(DEFAULT_LIMIT).catch(DEFAULT_LIMIT),
  offset: z.number().min(0).optional().default(0).catch(0),
  view: z.enum(['triage', 'pipeline', 'archive', 'all']).optional().default('triage').catch('triage'),
  subStatus: z.string().default('all').catch('all'),
  businessType: z
    .union([z.nativeEnum(BusinessType), z.literal('all')])
    .optional()
    .default('all')
    .catch('all'),
  industry: z
    .union([z.nativeEnum(Industry), z.literal('all')])
    .optional()
    .default('all')
    .catch('all'),
  stage: z
    .union([z.nativeEnum(CompanyStage), z.literal('all')])
    .optional()
    .default('all')
    .catch('all'),
  sort: z.string().optional()
});

type JobSearch = z.output<typeof jobSearchSchema>;

export const Route = createFileRoute('/jobs/')({
  validateSearch: jobSearchSchema.parse,
  component: JobsPage
});

const QUICK_ACTIONS: { label: string; status: JobStatus }[] = [
  { label: 'Later', status: JobStatus.LATER },
  { label: 'Applied', status: JobStatus.APPLIED },
  { label: 'Unfit', status: JobStatus.UNFIT }
];

const MORE_STATUSES: { label: string; status: JobStatus }[] = [
  { label: 'Low Salary', status: JobStatus.LOW_SALARY },
  { label: 'Expired', status: JobStatus.EXPIRED },
  { label: 'Recruiter Screen', status: JobStatus.RECRUITER_SCREEN },
  { label: 'Technical Screen', status: JobStatus.TECHNICAL_SCREEN }
];

const BUSINESS_TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  ...Object.values(BusinessType).map(v => ({ value: v, label: formatClassificationLabel(v) }))
] as const;

const INDUSTRY_OPTIONS = [
  { value: 'all', label: 'All industries' },
  ...Object.values(Industry).map(v => ({ value: v, label: formatClassificationLabel(v) }))
] as const;

const STAGE_OPTIONS = [
  { value: 'all', label: 'All stages' },
  ...Object.values(CompanyStage).map(v => ({ value: v, label: formatClassificationLabel(v) }))
] as const;

function SortIcon({ column, current, dir }: { column: string; current: string; dir: string }) {
  if (column !== current) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />;
  return dir === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
}

function JobsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const view = search.view as JobView;
  const viewConfig = JOB_VIEW_CONFIG[view];
  const defaultSort = `${viewConfig.defaultSort}:desc`;
  const currentSort = search.sort ?? defaultSort;
  const [sortBy, sortDir = 'desc'] = currentSort.split(':') as [string, 'asc' | 'desc'];
  const isTriage = view === 'triage';

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const bulkMutation = useBulkChangeStatus();

  // Clear selection on offset/view change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset selection when offset or view changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [search.offset, view]);

  const setSearch = (updates: Partial<JobSearch>) => {
    navigate({
      search: (prev: JobSearch) => ({
        ...prev,
        ...updates,
        offset:
          updates.offset !== undefined
            ? updates.offset
            : ('sort' in updates || 'view' in updates || 'subStatus' in updates ||
               'businessType' in updates || 'industry' in updates || 'stage' in updates)
              ? 0
              : prev.offset
      })
    });
  };

  const statuses = getViewStatuses(view, search.subStatus);
  const businessTypeParam = search.businessType === 'all' ? undefined : [search.businessType];
  const industryParam = search.industry === 'all' ? undefined : [search.industry];
  const stageParam = search.stage === 'all' ? undefined : [search.stage];

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.jobs.list({
      limit: search.limit,
      offset: search.offset,
      view,
      subStatus: search.subStatus,
      businessType: search.businessType,
      industry: search.industry,
      stage: search.stage,
      sort: currentSort
    }),
    queryFn: async () => {
      const res = await api.jobs.get({
        query: {
          limit: search.limit,
          offset: search.offset,
          target_salary: DEFAULT_TARGET_SALARY,
          // biome-ignore lint/suspicious/noExplicitAny: Eden Treaty type doesn't match Elysia's union schema for filter arrays
          status: statuses as any,
          // biome-ignore lint/suspicious/noExplicitAny: Eden Treaty type doesn't match Elysia's union schema for filter arrays
          business_type: businessTypeParam as any,
          // biome-ignore lint/suspicious/noExplicitAny: Eden Treaty type doesn't match Elysia's union schema for filter arrays
          industry: industryParam as any,
          // biome-ignore lint/suspicious/noExplicitAny: Eden Treaty type doesn't match Elysia's union schema for filter arrays
          stage: stageParam as any,
          sort: currentSort
        }
      });
      if (res.error) throw new Error(String(res.error));
      return res.data;
    }
  });

  const totalPages = data ? Math.ceil(data.pagination.total / data.pagination.limit) : 0;
  const currentPage = data ? Math.floor(data.pagination.offset / data.pagination.limit) + 1 : 1;
  const pageItemIds = data?.data.map(j => j.id) ?? [];
  const allSelected = pageItemIds.length > 0 && pageItemIds.every(id => selectedIds.has(id));

  const toggleSort = (column: 'score' | 'posted_at') => {
    if (sortBy === column) {
      setSearch({ sort: `${column}:${sortDir === 'asc' ? 'desc' : 'asc'}` });
    } else {
      setSearch({ sort: `${column}:desc` });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageItemIds));
    }
  };

  const handleBulkAction = (status: JobStatus) => {
    const ids = [...selectedIds];
    bulkMutation.mutate(
      { jobIds: ids, status },
      {
        onSuccess: () => {
          toast.success(`${ids.length} job${ids.length > 1 ? 's' : ''} moved to ${status}`);
          setSelectedIds(new Set());
        }
      }
    );
  };

  const colSpan = isTriage ? 6 : 5;

  return (
    <div className="space-y-4">
      {/* View tabs */}
      <div className="flex items-center gap-1 border-b pb-2">
        {JOB_VIEWS.map(v => {
          const config = JOB_VIEW_CONFIG[v];
          const Icon = config.icon;
          return (
            <Button
              key={v}
              variant={view === v ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSearch({ view: v, subStatus: 'all', sort: undefined })}
            >
              <Icon className="mr-1.5 h-4 w-4" />
              {config.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{viewConfig.label}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {viewConfig.statusOptions.length > 1 && (
            <Select
              value={String(search.subStatus ?? 'all')}
              onValueChange={value => setSearch({ subStatus: value ?? 'all' })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All in view</SelectItem>
                {viewConfig.statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Type</span>
            <Select
              value={search.businessType as string}
              onValueChange={value => setSearch({ businessType: value as JobSearch['businessType'] })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Industry</span>
            <Select
              value={search.industry as string}
              onValueChange={value => setSearch({ industry: value as JobSearch['industry'] })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Stage</span>
            <Select
              value={search.stage as string}
              onValueChange={value => setSearch({ stage: value as JobSearch['stage'] })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Job
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {isTriage && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="mx-1 h-4 w-px bg-border" />
          {QUICK_ACTIONS.map(action => (
            <Button
              key={action.status}
              variant="outline"
              size="sm"
              disabled={bulkMutation.isPending}
              onClick={() => handleBulkAction(action.status)}
            >
              {action.label}
            </Button>
          ))}
          <Select value="" onValueChange={value => handleBulkAction(value as JobStatus)}>
            <SelectTrigger className="w-[140px]" disabled={bulkMutation.isPending}>
              <SelectValue placeholder="More..." />
            </SelectTrigger>
            <SelectContent>
              {MORE_STATUSES.map(s => (
                <SelectItem key={s.status} value={s.status}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X className="mr-1 h-3.5 w-3.5" />
              Deselect
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {isTriage && (
                <TableHead className="w-[40px]">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                </TableHead>
              )}
              <TableHead className="w-[80px]">
                <button type="button" className="flex items-center font-medium" onClick={() => toggleSort('score')}>
                  Score
                  <SortIcon column="score" current={sortBy} dir={sortDir} />
                </button>
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[140px]">
                <button type="button" className="flex items-center font-medium" onClick={() => toggleSort('posted_at')}>
                  Posted
                  <SortIcon column="posted_at" current={sortBy} dir={sortDir} />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i.toString()}`}>
                    {isTriage && (
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    )}
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              : data?.data.map(job => (
                  <TableRow key={job.id} data-state={selectedIds.has(job.id) ? 'selected' : undefined}>
                    {isTriage && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(job.id)}
                          onCheckedChange={() => toggleSelect(job.id)}
                          aria-label={`Select ${job.title}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-sm tabular-nums">{job.expertScore}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {job.companyName}
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/jobs/$jobId"
                        params={{ jobId: job.id }}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <JobStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {job.postedAt ? formatDistanceToNow(new Date(job.postedAt), { addSuffix: true }) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                  No jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.pagination.total.toLocaleString()} jobs — page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={search.offset <= 0}
              onClick={() => setSearch({ offset: Math.max(0, search.offset - search.limit) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data && !data.pagination.hasNext}
              onClick={() => setSearch({ offset: search.offset + search.limit })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AddJobDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={jobId => navigate({ to: '/jobs/$jobId', params: { jobId } })}
      />
    </div>
  );
}
