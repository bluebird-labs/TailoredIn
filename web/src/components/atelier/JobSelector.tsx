import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobDescriptions } from '@/hooks/use-job-descriptions';

export function JobSelector({ value, onChange }: { value: string | null; onChange: (jobId: string | null) => void }) {
  const { data: jobs, isLoading } = useJobDescriptions();

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Job Description</p>
      <Select value={value ?? ''} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? 'Loading jobs...' : 'Select a job description...'} />
        </SelectTrigger>
        <SelectContent>
          {(jobs ?? []).map(job => (
            <SelectItem key={job.id} value={job.id}>
              {job.title} — {job.companyName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
