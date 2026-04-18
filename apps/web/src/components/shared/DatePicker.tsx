import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FieldError } from './FieldError.js';

interface DatePickerProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly required?: boolean;
  readonly isDirty?: boolean;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  label,
  value,
  onChange,
  required,
  isDirty,
  error,
  disabled,
  placeholder
}: DatePickerProps) {
  const selected = toDate(value);

  return (
    <div data-slot="editable-field" className={cn('space-y-1.5', isDirty && 'border-l-2 border-primary/30 pl-3')}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Popover>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            'inline-flex w-full items-center justify-start rounded-md border border-input bg-card px-3 py-2 text-sm transition-colors hover:bg-accent/40',
            !value && 'text-muted-foreground'
          )}
          aria-invalid={!!error || undefined}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          {selected
            ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : (placeholder ?? 'Pick a date')}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={date => onChange(date ? toIsoDate(date) : '')}
            defaultMonth={selected}
          />
        </PopoverContent>
      </Popover>
      <FieldError message={error} />
    </div>
  );
}
