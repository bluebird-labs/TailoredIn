const LABEL_MAP: Record<string, string> = {
  b2b: 'B2B',
  b2c: 'B2C',
  b2b2c: 'B2B2C',
  b2g: 'B2G',
  d2c: 'D2C',
  marketplace: 'Marketplace',
  platform: 'Platform',
  automobile: 'Automobile',
  security: 'Security',
  finance: 'Finance',
  healthcare: 'Healthcare',
  education: 'Education',
  e_commerce: 'E-Commerce',
  real_estate: 'Real Estate',
  media: 'Media',
  logistics: 'Logistics',
  energy: 'Energy',
  agriculture: 'Agriculture',
  travel: 'Travel',
  food: 'Food',
  legal: 'Legal',
  hr: 'HR',
  marketing: 'Marketing',
  saas: 'SaaS',
  ai_ml: 'AI/ML',
  gaming: 'Gaming',
  telecom: 'Telecom',
  insurance: 'Insurance',
  retail: 'Retail',
  construction: 'Construction',
  government: 'Government',
  seed: 'Seed',
  series_a: 'Series A',
  series_b: 'Series B',
  series_c: 'Series C',
  series_d_plus: 'Series D+',
  growth: 'Growth',
  public: 'Public',
  bootstrapped: 'Bootstrapped',
  acquired: 'Acquired'
};

export function formatClassificationLabel(value: string): string {
  return LABEL_MAP[value] ?? value;
}

export function ClassificationBadge({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return (
      <span className="text-xs text-muted-foreground">
        {label}: <span className="italic">Unclassified</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
      {label}: {formatClassificationLabel(value)}
    </span>
  );
}
