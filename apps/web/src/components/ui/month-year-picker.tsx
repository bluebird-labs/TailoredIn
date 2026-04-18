import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' }
];

function getYears(): string[] {
  const current = new Date().getFullYear();
  const years: string[] = [];
  for (let y = current + 1; y >= current - 30; y--) {
    years.push(String(y));
  }
  return years;
}

type MonthYearPickerProps = {
  value: string; // "YYYY-MM" or ""
  onChange: (value: string) => void;
};

export function MonthYearPicker({ value, onChange }: MonthYearPickerProps) {
  const [year, month] = value ? value.split('-') : ['', ''];

  function handleMonthChange(m: string | null) {
    if (!m) return;
    if (year) onChange(`${year}-${m}`);
    else onChange(`${new Date().getFullYear()}-${m}`);
  }

  function handleYearChange(y: string | null) {
    if (!y) return;
    if (month) onChange(`${y}-${month}`);
    else onChange(`${y}-01`);
  }

  return (
    <div className="flex gap-2">
      <Select value={month || undefined} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map(m => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year || undefined} onValueChange={handleYearChange}>
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {getYears().map(y => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
