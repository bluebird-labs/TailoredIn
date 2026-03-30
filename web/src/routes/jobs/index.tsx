import { JobStatus } from '@tailoredin/domain/web';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { z } from 'zod';
import { JobStatusBadge } from '@/components/jobs/status-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { DEFAULT_PAGE_SIZE, DEFAULT_TARGET_SALARY } from '@/lib/constants';
import { queryKeys } from '@/lib/query-keys';

const jobSearchSchema = z.object({
  page: z.number().min(1).optional().default(1).catch(1),
  pageSize: z.number().min(1).max(100).optional().default(DEFAULT_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE),
  status: z
    .union([z.nativeEnum(JobStatus), z.literal('all')])
    .optional()
    .default(JobStatus.NEW)
    .catch(JobStatus.NEW),
  sortBy: z.enum(['score', 'posted_at']).optional().default('score').catch('score'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc').catch('desc')
});

type JobSearch = z.output<typeof jobSearchSchema>;

export const Route = createFileRoute('/jobs/')({
  validateSearch: jobSearchSchema.parse,
  component: JobsPage
});

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
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
  { value: JobStatus.LOW_SALARY, label: 'Low Salary' },
  { value: JobStatus.RETIRED, label: 'Retired' }
] as const;

function SortIcon({ column, current, dir }: { column: string; current: string; dir: string }) {
  if (column !== current) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />;
  return dir === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
}

function JobsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const setSearch = (updates: Partial<JobSearch>) => {
    navigate({
      search: (prev: JobSearch) => ({
        ...prev,
        ...updates,
        page: updates.page ?? ('sortBy' in updates || 'status' in updates ? 1 : prev.page)
      })
    });
  };

  const statusParam = search.status === 'all' ? undefined : [search.status];

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.jobs.list({
      page: search.page,
      pageSize: search.pageSize,
      status: search.status,
      sortBy: search.sortBy,
      sortDir: search.sortDir
    }),
    queryFn: async () => {
      const res = await api.jobs.get({
        query: {
          page: search.page,
          page_size: search.pageSize,
          target_salary: DEFAULT_TARGET_SALARY,
          // biome-ignore lint/suspicious/noExplicitAny: Eden Treaty type doesn't match Elysia's union schema for status arrays
          status: statusParam as any,
          sort_by: search.sortBy,
          sort_dir: search.sortDir
        }
      });
      if (res.error) throw new Error(String(res.error));
      return res.data.data;
    }
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const toggleSort = (column: 'score' | 'posted_at') => {
    if (search.sortBy === column) {
      setSearch({ sortDir: search.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      setSearch({ sortBy: column, sortDir: 'desc' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <div className="flex items-center gap-3">
          <Select
            value={search.status as string}
            onValueChange={value => setSearch({ status: value as JobSearch['status'] })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">
                <button type="button" className="flex items-center font-medium" onClick={() => toggleSort('score')}>
                  Score
                  <SortIcon column="score" current={search.sortBy} dir={search.sortDir} />
                </button>
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[140px]">
                <button type="button" className="flex items-center font-medium" onClick={() => toggleSort('posted_at')}>
                  Posted
                  <SortIcon column="posted_at" current={search.sortBy} dir={search.sortDir} />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i.toString()}`}>
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
              : data?.items.map(job => (
                  <TableRow key={job.id}>
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
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
            {data.total.toLocaleString()} jobs — page {data.page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={search.page <= 1}
              onClick={() => setSearch({ page: search.page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={search.page >= totalPages}
              onClick={() => setSearch({ page: search.page + 1 })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
