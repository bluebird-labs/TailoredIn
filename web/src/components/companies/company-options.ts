type SelectOption = { readonly label: string; readonly value: string };

export const businessTypeOptions: readonly SelectOption[] = [
  { label: 'B2B', value: 'b2b' },
  { label: 'B2C', value: 'b2c' },
  { label: 'B2B2C', value: 'b2b2c' },
  { label: 'B2G', value: 'b2g' },
  { label: 'D2C', value: 'd2c' },
  { label: 'Marketplace', value: 'marketplace' },
  { label: 'Platform', value: 'platform' }
];

export const industryOptions: readonly SelectOption[] = [
  { label: 'Agriculture', value: 'agriculture' },
  { label: 'AI / ML', value: 'ai_ml' },
  { label: 'Automobile', value: 'automobile' },
  { label: 'Construction', value: 'construction' },
  { label: 'E-Commerce', value: 'e_commerce' },
  { label: 'Education', value: 'education' },
  { label: 'Energy', value: 'energy' },
  { label: 'Finance', value: 'finance' },
  { label: 'Food', value: 'food' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Government', value: 'government' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'HR', value: 'hr' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Legal', value: 'legal' },
  { label: 'Logistics', value: 'logistics' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Media', value: 'media' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'Retail', value: 'retail' },
  { label: 'SaaS', value: 'saas' },
  { label: 'Security', value: 'security' },
  { label: 'Telecom', value: 'telecom' },
  { label: 'Travel', value: 'travel' }
];

export const stageOptions: readonly SelectOption[] = [
  { label: 'Seed', value: 'seed' },
  { label: 'Series A', value: 'series_a' },
  { label: 'Series B', value: 'series_b' },
  { label: 'Series C', value: 'series_c' },
  { label: 'Series D+', value: 'series_d_plus' },
  { label: 'Growth', value: 'growth' },
  { label: 'Public', value: 'public' },
  { label: 'Bootstrapped', value: 'bootstrapped' },
  { label: 'Acquired', value: 'acquired' }
];

const labelMaps = {
  businessType: Object.fromEntries(businessTypeOptions.map(o => [o.value, o.label])),
  industry: Object.fromEntries(industryOptions.map(o => [o.value, o.label])),
  stage: Object.fromEntries(stageOptions.map(o => [o.value, o.label]))
};

export function formatEnumLabel(type: 'businessType' | 'industry' | 'stage', value: string | null): string | null {
  if (!value) return null;
  return labelMaps[type][value] ?? value;
}
