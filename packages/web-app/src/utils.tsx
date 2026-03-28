import * as DateFns from 'date-fns';

export const toRelativeDateString = (date: Date): string => {
  return DateFns.formatDistance(date, new Date(), {
    addSuffix: true
  });
};

export const formatSalary = (salary: number | null): string | null => {
  if (salary === null) {
    return null;
  }

  return `${Math.round(salary / 1000)}k`;
};
