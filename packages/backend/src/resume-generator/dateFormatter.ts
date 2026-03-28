import { format, parse } from 'date-fns';

const formatDate = (dateStr: string): string => {
  if (dateStr === 'present') return 'Present';
  const date = parse(dateStr, 'yyyy-MM', new Date());
  return format(date, 'MMM yyyy');
};

export const formatDateRange = (start: string, end: string): string => {
  return `${formatDate(start)} \u2013 ${formatDate(end)}`;
};
