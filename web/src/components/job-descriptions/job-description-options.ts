type SelectOption = { readonly label: string; readonly value: string };

export const jobLevelOptions: readonly SelectOption[] = [
  { label: 'Internship', value: 'internship' },
  { label: 'Entry Level', value: 'entry_level' },
  { label: 'Associate', value: 'associate' },
  { label: 'Mid-Senior', value: 'mid_senior' },
  { label: 'Director', value: 'director' },
  { label: 'Executive', value: 'executive' }
];

export const locationTypeOptions: readonly SelectOption[] = [
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Onsite', value: 'onsite' }
];

export const currencyOptions: readonly SelectOption[] = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'CAD', value: 'CAD' },
  { label: 'CHF', value: 'CHF' }
];

const labelMaps = {
  level: Object.fromEntries(jobLevelOptions.map(o => [o.value, o.label])),
  locationType: Object.fromEntries(locationTypeOptions.map(o => [o.value, o.label]))
};

export function formatEnumLabel(type: 'level' | 'locationType', value: string | null): string | null {
  if (!value) return null;
  return labelMaps[type][value] ?? value;
}
