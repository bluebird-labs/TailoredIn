export type MockJob = {
  id: string;
  title: string;
  companyName: string;
};

export type MockExperience = {
  experienceId: string;
  experienceTitle: string;
  companyName: string;
  startDate: string;
  endDate: string;
  summary: string;
  bullets: string[];
  hiddenBulletIndices: number[];
  bulletOverride: { min: number; max: number } | null;
};

export type MockEducation = {
  id: string;
  degreeTitle: string;
  institutionName: string;
};

export type MockSettings = {
  modelTier: 'fast' | 'balanced' | 'best';
  bulletMin: number;
  bulletMax: number;
  prompts: {
    resume: string;
    headline: string;
    experience: string;
  };
};

export type MockResumeOutput = {
  headline: string;
  experiences: MockExperience[];
  educations: MockEducation[];
  hiddenEducationIds: string[];
};

export const MOCK_JOBS: MockJob[] = [
  { id: 'job-1', title: 'Senior Software Engineer', companyName: 'Stripe' },
  { id: 'job-2', title: 'Staff Engineer, Platform', companyName: 'Datadog' },
  { id: 'job-3', title: 'Engineering Manager', companyName: 'Figma' }
];

export const MOCK_SETTINGS: MockSettings = {
  modelTier: 'balanced',
  bulletMin: 3,
  bulletMax: 5,
  prompts: {
    resume: 'Focus on measurable impact and technical leadership. Use past tense for previous roles.',
    headline: '',
    experience: ''
  }
};

export const MOCK_RESUME_OUTPUT: MockResumeOutput = {
  headline: 'Full-stack engineering leader with 12+ years building scalable platforms, APIs, and developer tools',
  experiences: [
    {
      experienceId: 'exp-1',
      experienceTitle: 'Head of Platform',
      companyName: 'ResortPass',
      startDate: '2025-03',
      endDate: '2026-04',
      summary: 'Led platform engineering for a Series C hospitality marketplace.',
      bullets: [
        'Architected event-driven microservices platform processing 2M+ daily transactions with 99.95% uptime',
        'Built internal developer portal reducing onboarding time from 2 weeks to 3 days',
        'Led migration from monolithic Rails app to distributed TypeScript services, cutting deploy times by 80%',
        'Established platform reliability practices including SLO tracking, incident response, and chaos engineering'
      ],
      hiddenBulletIndices: [],
      bulletOverride: null
    },
    {
      experienceId: 'exp-2',
      experienceTitle: 'Senior Engineering Manager',
      companyName: 'Brightflow AI',
      startDate: '2023-09',
      endDate: '2024-06',
      summary: 'Managed two engineering teams building AI-powered financial analytics.',
      bullets: [
        'Grew engineering team from 4 to 12 engineers across frontend and backend squads',
        'Shipped real-time cash flow forecasting feature used by 500+ SMBs within first quarter',
        'Introduced TDD practices and increased test coverage from 35% to 82%'
      ],
      hiddenBulletIndices: [],
      bulletOverride: { min: 2, max: 3 }
    },
    {
      experienceId: 'exp-3',
      experienceTitle: 'Engineering Manager',
      companyName: 'Volvo Cars',
      startDate: '2020-03',
      endDate: '2023-04',
      summary: 'Led connected vehicle platform team building APIs for 500K+ vehicles.',
      bullets: [
        'Managed cross-functional team of 8 engineers delivering vehicle connectivity APIs serving 500K+ cars',
        'Designed and shipped OTA update pipeline reducing firmware deployment time from days to hours',
        'Drove adoption of GraphQL federation across 6 backend teams, unifying 12 microservices',
        'Mentored 3 engineers to senior level through structured growth plans and pairing sessions',
        'Reduced platform incidents by 60% through automated canary deployments and observability tooling'
      ],
      hiddenBulletIndices: [4],
      bulletOverride: null
    }
  ],
  educations: [
    { id: 'edu-1', degreeTitle: 'B.S. Computer Science', institutionName: 'AFPA Creteil' },
    { id: 'edu-2', degreeTitle: 'Modern Management Techniques', institutionName: 'CNFDI Paris' }
  ],
  hiddenEducationIds: []
};
