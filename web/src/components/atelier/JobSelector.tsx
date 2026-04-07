import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOCK_JOBS } from './mock-data.js';

export function JobSelector({ value, onChange }: { value: string | null; onChange: (jobId: string | null) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Job Description</p>
      <Select value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a job description..." />
        </SelectTrigger>
        <SelectContent>
          {MOCK_JOBS.map(job => (
            <SelectItem key={job.id} value={job.id}>
              {job.title} — {job.companyName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
