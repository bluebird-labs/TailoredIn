type SelectOption = { readonly label: string; readonly value: string };

export const businessTypeOptions: readonly SelectOption[] = [
  { label: 'B2B', value: 'b2b' },
  { label: 'B2C', value: 'b2c' },
  { label: 'B2B2C', value: 'b2b2c' },
  { label: 'B2G', value: 'b2g' },
  { label: 'D2C', value: 'd2c' },
  { label: 'Marketplace', value: 'marketplace' },
  { label: 'Platform', value: 'platform' },
  { label: 'Enterprise', value: 'enterprise' }
];

export const industryOptions: readonly SelectOption[] = [
  { label: 'Aerospace & Defense', value: 'aerospace_defense' },
  { label: 'Agriculture', value: 'agriculture' },
  { label: 'AI', value: 'ai' },
  { label: 'Automobile', value: 'automobile' },
  { label: 'Biotech', value: 'biotech' },
  { label: 'Climate Tech', value: 'climate_tech' },
  { label: 'Consulting', value: 'consulting' },
  { label: 'Construction', value: 'construction' },
  { label: 'Crypto / Web3', value: 'crypto_web3' },
  { label: 'Cybersecurity', value: 'cybersecurity' },
  { label: 'E-Commerce', value: 'e_commerce' },
  { label: 'Education', value: 'education' },
  { label: 'Energy', value: 'energy' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Finance', value: 'finance' },
  { label: 'Fintech', value: 'fintech' },
  { label: 'Food', value: 'food' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Government', value: 'government' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'HR Tech', value: 'hr_tech' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Legal', value: 'legal' },
  { label: 'Logistics', value: 'logistics' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Martech', value: 'martech' },
  { label: 'Media', value: 'media' },
  { label: 'Nonprofit', value: 'nonprofit' },
  { label: 'Pharma', value: 'pharma' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'Retail', value: 'retail' },
  { label: 'Semiconductor', value: 'semiconductor' },
  { label: 'Software', value: 'software' },
  { label: 'Telecom', value: 'telecom' },
  { label: 'Transportation', value: 'transportation' },
  { label: 'Travel', value: 'travel' }
];

export const stageOptions: readonly SelectOption[] = [
  { label: 'Pre-Seed', value: 'pre_seed' },
  { label: 'Seed', value: 'seed' },
  { label: 'Series A', value: 'series_a' },
  { label: 'Series B', value: 'series_b' },
  { label: 'Series C', value: 'series_c' },
  { label: 'Series D+', value: 'series_d_plus' },
  { label: 'Late Stage', value: 'late_stage' },
  { label: 'IPO', value: 'ipo' },
  { label: 'Public', value: 'public' },
  { label: 'Private Equity', value: 'private_equity' },
  { label: 'Bootstrapped', value: 'bootstrapped' }
];

export const statusOptions: readonly SelectOption[] = [
  { label: 'Running', value: 'running' },
  { label: 'Acquired', value: 'acquired' },
  { label: 'Merged', value: 'merged' },
  { label: 'Defunct', value: 'defunct' },
  { label: 'Stealth', value: 'stealth' }
];

const labelMaps = {
  businessType: Object.fromEntries(businessTypeOptions.map(o => [o.value, o.label])),
  industry: Object.fromEntries(industryOptions.map(o => [o.value, o.label])),
  stage: Object.fromEntries(stageOptions.map(o => [o.value, o.label])),
  status: Object.fromEntries(statusOptions.map(o => [o.value, o.label]))
};

export function formatEnumLabel(
  type: 'businessType' | 'industry' | 'stage' | 'status',
  value: string | null
): string | null {
  if (!value) return null;
  return labelMaps[type][value] ?? value;
}
