type AtsPlatform = { name: string };

const PLATFORM_RULES: { pattern: string; name: string }[] = [
  { pattern: 'greenhouse.io', name: 'Greenhouse' },
  { pattern: 'jobs.lever.co', name: 'Lever' },
  { pattern: 'myworkdayjobs.com', name: 'Workday' },
  { pattern: 'jobs.ashbyhq.com', name: 'Ashby' },
  { pattern: 'jobvite.com', name: 'Jobvite' },
  { pattern: 'taleo.net', name: 'Taleo' },
  { pattern: 'icims.com', name: 'iCIMS' },
  { pattern: 'breezy.hr', name: 'Breezy' },
  { pattern: 'applytojob.com', name: 'Rippling' },
  { pattern: 'smartrecruiters.com', name: 'SmartRecruiters' },
  { pattern: 'bamboohr.com', name: 'BambooHR' },
  { pattern: 'recruitee.com', name: 'Recruitee' },
  { pattern: 'jazz.co', name: 'JazzHR' },
  { pattern: 'ultipro.com', name: 'UKG' },
  { pattern: 'paylocity.com', name: 'Paylocity' },
  { pattern: 'paycomonline.net', name: 'Paycom' }
];

export function detectAtsPlatform(url: string): AtsPlatform | null {
  try {
    const { hostname } = new URL(url);
    const rule = PLATFORM_RULES.find(r => hostname === r.pattern || hostname.endsWith(`.${r.pattern}`));
    return rule ? { name: rule.name } : null;
  } catch {
    return null;
  }
}
