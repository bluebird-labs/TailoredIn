/**
 * Typed resume seed data — plain objects, no ORM imports.
 * The ResumeDataSeeder resolves these into entity instances.
 */

// ── User ────────────────────────────────────────────────────────────

export const userData = {
  email: 'estevez.sylvain@gmail.com',
  firstName: 'Sylvain',
  lastName: 'Estevez',
  phoneNumber: '+1 415 619 7821',
  githubHandle: 'SylvainEstevez',
  linkedinHandle: 'sylvain-estevez',
  locationLabel: 'New York, NY'
} as const;

// ── Companies + Positions ───────────────────────────────────────────

export type CompanyDef = {
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  joinedAt: string;
  leftAt: string;
  promotedAt: string | null;
  locations: string[];
};

export const companyDefs = {
  resortpass: {
    companyName: 'ResortPass',
    companyMention: null,
    websiteUrl: 'https://www.resortpass.com/',
    businessDomain: 'B2C, B2B, Marketplace, Hospitality, Daycation',
    joinedAt: '2025-03',
    leftAt: '2026-04',
    promotedAt: null,
    locations: ['New York, NY']
  },
  lantern: {
    companyName: 'Stealth Startup',
    companyMention: 'contract',
    websiteUrl: null,
    businessDomain: 'B2B, SAAS',
    joinedAt: '2024-09',
    leftAt: '2024-11',
    promotedAt: null,
    locations: ['New York, NY']
  },
  brightflow: {
    companyName: 'Brightflow.ai',
    companyMention: 'defunct',
    websiteUrl: 'https://brightflow.ai/',
    businessDomain: 'B2B, SAAS, Fintech, Loans Underwriting, Cash Flow Management',
    joinedAt: '2023-09',
    leftAt: '2024-06',
    promotedAt: '2024-03',
    locations: ['New York, NY']
  },
  volvo: {
    companyName: 'Volvo Cars',
    companyMention: null,
    websiteUrl: 'https://www.volvocars.com/us/',
    businessDomain: 'Automotive, High-End Car Services',
    joinedAt: '2018-01',
    leftAt: '2023-04',
    promotedAt: '2020-03',
    locations: ['New York, NY', 'Stockholm, Sweden']
  },
  luxe: {
    companyName: 'Luxe',
    companyMention: 'acquired by Volvo Cars',
    websiteUrl: null,
    businessDomain: 'B2C, B2B, On-Demand Valet Parking, Rental Car Delivery',
    joinedAt: '2016-06',
    leftAt: '2017-12',
    promotedAt: null,
    locations: ['San Francisco, CA']
  },
  streamnation: {
    companyName: 'StreamNation',
    companyMention: 'defunct',
    websiteUrl: null,
    businessDomain: 'B2C, SAAS, Media Library Management',
    joinedAt: '2015-12',
    leftAt: '2016-06',
    promotedAt: null,
    locations: ['San Francisco, CA']
  },
  planorama: {
    companyName: 'Planorama',
    companyMention: null,
    websiteUrl: 'https://planorama.com/',
    businessDomain: 'B2B, SAAS, Retail, Image Recognition',
    joinedAt: '2014-04',
    leftAt: '2015-11',
    promotedAt: '2014-08',
    locations: ['Paris, France']
  },
  luckycart: {
    companyName: 'LuckyCart',
    companyMention: null,
    websiteUrl: 'https://www.luckycart.com/en/',
    businessDomain: 'SAAS, E-Commerce, Marketing, Customer Engagement',
    joinedAt: '2012-09',
    leftAt: '2014-04',
    promotedAt: null,
    locations: ['Paris, France']
  }
} as const satisfies Record<string, CompanyDef>;

export type CompanyKey = keyof typeof companyDefs;

// ── Bullets (per company, assigned to first position) ───────────────

export const bulletDefs: Record<CompanyKey, string[]> = {
  resortpass: [
    'Built and led a platform team of senior specialists serving a 25-engineer org across product engineering, data, and QA as a horizontal enablement function',
    'Drove recruiting that landed critical senior hires: Engineering Manager, Senior Engineering Manager, and Staff Engineer',
    'Partnered with the VP of Engineering to own the platform roadmap, turning org-wide pain points and improvement opportunities into a structured, prioritized execution plan',
    'Acted as de facto architect org-wide \u2014 reviewed Technical Design Docs, shaped backend decisions, and guided engineers on architecture to maintain technical consistency across all product teams',
    'Drove test automation adoption org-wide, establishing standards that eliminated manual verification overhead',
    'Built a developer enablement platform \u2014 CLI with composable skills and commands, AI code review in CI (Claude Code), and Jira integration \u2014 automating the full lifecycle from issue creation and branching through PR feedback and merge; tooling updates distributed to all repos via automated PRs from a central repository',
    'Embedded automated quality and security gates in every repo (linters, coverage, static analysis, secret detection), raising the engineering baseline for 25 engineers without adding review overhead',
    'Introduced APM and structured logging org-wide, set up automated service and infra monitors, and wired vulnerability detection directly to Jira \u2014 closing the loop from discovery to remediation without manual triage',
    'Owned platform architecture on AWS \u2014 service boundaries, data flows, and infrastructure topology \u2014 and designed a compliance-driven environment strategy with a dedicated developer sandbox isolated from staging and production',
    'Reduced production outages to zero \u2014 the platform had seen 2 in 3 months \u2014 through reliability improvements, proactive seasonal scaling, and FinOps right-sizing',
    'Established incident response and on-call practices driven by automated monitors, replacing reactive firefighting with a structured detection-escalation-resolution playbook',
    'Enabled a strategic MSA with a top-tier global hospitality group by building the enterprise compliance posture required for procurement: SOC 2, PCI DSS Service Provider certification, privileged access controls, and audit-ready infrastructure',
    'Led ResortPass through SOC 2 Type I and II \u2014 partnered with auditors (Latacora) on Type I policy definition, then owned Type II end-to-end: IT processes, compliance tooling, and control monitoring in Vanta',
    'Led PCI DSS Service Provider compliance from contract negotiation to SAQ-D AOC to unblock a critical MSA, correctly scoping the engagement around Stripe\u2019s card processing delegation',
    'Deployed StrongDM as the privileged access layer across all production infrastructure, eliminating direct DB/SSH access and generating a full audit trail for compliance and incident investigations',
    'Built a cost-efficient MLOps platform on Airflow and EKS powering dynamic ranking and personalized recommendations, architected to scale to zero when idle and provision on demand',
    'Maintained and scaled the analytics platform (CDC, Redshift, ETL) with secure, audited SSH access for reliable BI and ML data availability'
  ],
  lantern: [
    'Leveraged LLMs (OpenAI, Anthropic), prompt engineering, and Playwright-driven web scraping to equip sales teams with prospect insights',
    'Enabled local development and CI/CD pipelines: containerized Supabase (PostgreSQL) and BullQ (Redis) using Docker, split existing schema (tables, stored procedures) into manageable SQL migrations, implemented unit testing frameworks and GitHub Actions workflows',
    'Selectively optimized SQL queries and revised schemas to resolve performance bottlenecks, increased trigram (pg_trgm) similarity search accuracy from low ~40% to 86%+',
    'Built a pipeline to ingest S3-delivered data into ElasticSearch, enabling fast, term-based search and retrieval'
  ],
  brightflow: [
    'Built an event-driven ETL framework with Node.js, Kafka (MSK), and Kubernetes Job (EKS), prioritizing robustness, scalability, and observability (X-Ray, CloudWatch, OpenTelemetry, Grafana)',
    'Delivered data to Athena (Apache Presto, S3-indexed) for analytics/ML, Aurora (PostgreSQL) through REST APIs for real-time applications, and complex Excel reports for loan underwriting',
    'Integrated 12+ external APIs (including Plaid, Shopify, Rutter, FB Marketplace, QBO) to ingest and normalize sales, marketing, accounting, and banking data',
    'Automated OpenAPI documentation maintenance with Docusaurus using a bottom-up approach, preparing REST APIs for public release during company pivot',
    'Fostered a culture of collaboration and accountability in technical decision-making by implementing Architecture Decision Records (ADRs) for transparency and alignment',
    'Effectively managed employee under pre-existing PIP and helped them get back on track',
    'Instilled a collaboration and feedback culture for technical decisions relying on ADRs (Architecture Decision Records)',
    'As SCRUM master, solidified Agile practices across the organization, resulting in increased predictability and transparency',
    'Drove organization-wide alignment on 3 major initiatives, leading to their completion in a timely manner'
  ],
  volvo: [
    'Redesigned valet services and asset management using Domain-Driven Design, expanding global availability (20+ markets) by optimizing AWS regions and Route53 geolocation for lower latency and higher uptime',
    'Collaborated cross-functionally with operations, product, NSCs, and dealerships to streamline dealer workflows and enhance customer experience',
    'Developed REST APIs to integrate valet services with the Volvo On Call app, Volvo Cars website, and dealer booking systems',
    'Implemented CCPA and GDPR-compliant data redaction and retention policies to ensure legal compliance in the US and EU',
    'Monitored system health with Prometheus, Jaeger, and Grafana; set up Slack and PagerDuty alerts to optimize uptime, performance, and incident response',
    'Grew the team from 4 to 10 engineers spanning backend, frontend, mobile, QA and devops in a 6 timezones remote setup (US East/West Coasts, South America, Europe)',
    'Acted as product manager for over a year as we were looking for a replacement',
    "Trusted to act as engineering director in the director's absence (35 engineers)",
    "Delivered Volvo Valet's initial distributed architecture with Node.js, TypeScript, and MySQL (Aurora), running on Kubernetes behind Amazon API Gateway, launching the product within an aggressive 6-month timeline",
    'Engineered logistics orchestration for a ZipCar-like Volvo Cars subsidiary, transferring knowledge acquired at Luxe and using evolutionary algorithms to enhance efficiency and fully automate vehicle and personnel movement',
    "Influenced building Volvo's central infrastructure platform in AWS, cutting costs by leveraging economies of scale and streamlining onboarding for CI/CD, deployment, and resource provisioning"
  ],
  luxe: [
    'Piloted the migration from a large vanilla Node.js monolith into manageable TypeScript micro services, improving scalability and providing flexible APIs to frontend engineers',
    'In collaboration with the data science team, proposed and implemented a data model for optimizing the orchestration and assignments of valets to customers, resulting in improved operational efficiency and customer satisfaction',
    'Played a pivotal role in agile development process, including sprint planning, estimation, and retrospectives, establishing transparency and accountability for the engineering organization'
  ],
  streamnation: [
    'Designed and deployed the microservices architecture using Node.js / TypeScript, MongoDB and MySQL',
    'Sparked and initiated the development of the responsive web SPA (Angular) using WebSockets',
    'Developed a desktop app using NW.js and Electron, delivering a native-like user experience across all platforms'
  ],
  planorama: [
    'Architected and coded a 20+ Node.js microservices platform to support a fantastic 5x business growth within a year',
    'Executed contractual SLAs with industry-leading global clients (Coca Cola, Danone, Mondelez), consistently maintaining high performance and worldwide availability; met service level targets, fostering long-term partnerships',
    'Hired, trained and managed the web team from 4 to 16 engineers team across 3 locations',
    'Promoted 3 team members to tech lead positions, leading to better onboarding of new hires and increased accountability'
  ],
  luckycart: [
    'Delivered an online SAAS mail and web pages editor, enabling users to create and edit professional-looking email templates and pages with ease, all within an Ember.js SPA',
    'Maintained and scaled the 5 microservices Node.js / Java architecture under the CTO\u2019s guidance',
    'Created 3 online card games for a clairvoyance website, increasing website traffic',
    'Developed a visually appealing, functional website for a Californian restaurant, driving online engagement and customer satisfaction'
  ]
};

// ── Education ───────────────────────────────────────────────────────

export const educationDefs = [
  {
    degreeTitle: 'B.S. in Computer Science',
    institutionName: 'AFPA Cr\u00e9teil',
    graduationYear: '2012',
    locationLabel: 'Paris, France'
  },
  {
    degreeTitle: 'Certification in Modern Management Techniques',
    institutionName: 'CNFDI Paris',
    graduationYear: '2008',
    locationLabel: 'Paris, France'
  },
  {
    degreeTitle: 'High School Diploma in Electronics',
    institutionName: 'Lyc\u00e9e de la Mare Carr\u00e9e',
    graduationYear: '2003',
    locationLabel: 'Moissy-Cramayel, France'
  }
] as const;

// ── Skill Categories ────────────────────────────────────────────────

export const skillCategoryDefs: [string, string[]][] = [
  [
    'architecture',
    ['OOP Principles & Design Patterns', 'Microservices', 'ETL', 'Event-driven', 'SOA', 'DDD', 'REST', 'GraphQL']
  ],
  ['backend', ['Node.js (since 2012)', 'TypeScript (expert)', 'Java (rusty)', 'Python (learning)']],
  [
    'storage',
    ['PostgreSQL', 'MySQL', 'Kafka', 'BullQ', 'ElasticSearch', 'Redis', 'Presto', 'Memcache', 'MongoDB', 'RabbitMQ']
  ],
  [
    'devOps',
    [
      'AWS Cloud',
      'Docker',
      'Kubernetes',
      'Terraform',
      'Helm',
      'GitHub Actions',
      'Spinnaker',
      'Jenkins',
      'Vercel',
      'Heroku'
    ]
  ],
  ['telemetry', ['Jaeger', 'Zipkin', 'Grafana', 'Kibana', 'Prometheus', 'Splunk']],
  ['frontend', ['Ember.js', 'Angular.js', 'SCSS', 'SASS', 'React']],
  ['interests', ['Golang', 'Scala', 'Kotlin', 'Rust', 'C#']]
];

// ── Headline ────────────────────────────────────────────────────────

export const headlineData = {
  headlineLabel: 'Leader',
  summaryText:
    'Engineering leader with 15 years building high-performing teams and delivering data-intensive products and systems. Focused on technical excellence, engineering efficiency, and the AI and infrastructure foundations that let organizations move fast with confidence.'
} as const;

// ── Archetypes ──────────────────────────────────────────────────────

export type ArchetypePositionDef = {
  companyKey: CompanyKey;
  positionIndex: number;
  jobTitle: string;
  displayCompanyName: string;
  locationLabel: string;
  startDate: string;
  endDate: string;
  roleSummary: string;
  bulletIndices: number[];
};

export type ArchetypeDef = {
  archetypeKey: string;
  archetypeLabel: string;
  archetypeDescription: string;
  socialNetworks: string[];
  educationIndices: number[];
  interestItemOverrides: string[] | null;
  positions: ArchetypePositionDef[];
};

export const archetypeDefs: ArchetypeDef[] = [
  {
    archetypeKey: 'leader_individual_contributor',
    archetypeLabel: 'Lead IC',
    archetypeDescription:
      'Experienced engineer who demonstrates leadership and guides teams — for platform, infrastructure, and senior IC roles',
    socialNetworks: ['GitHub', 'LinkedIn'],
    educationIndices: [0],
    interestItemOverrides: null,
    positions: [
      {
        companyKey: 'resortpass',
        positionIndex: 0,
        jobTitle: 'Head of Platform',
        displayCompanyName: 'ResortPass',
        locationLabel: 'New York, NY',
        startDate: '2025-03',
        endDate: '2026-04',
        roleSummary:
          'Built the enterprise foundation at ResortPass, a two-sided marketplace connecting consumers to daycation experiences at premium hotels and resorts. Owned the structural layer of the platform \u2014 stability, security, compliance, and engineering efficiency',
        bulletIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
      },
      {
        companyKey: 'lantern',
        positionIndex: 0,
        jobTitle: 'Staff Software Engineer',
        displayCompanyName: 'Stealth Startup #smallcaps[(contract)]',
        locationLabel: 'New York, NY',
        startDate: '2024-09',
        endDate: '2024-11',
        roleSummary:
          'Consulted for an early-stage B2B SaaS startup preparing for growth, addressed stability/performance issues and built a scalable foundation',
        bulletIndices: [0, 1, 2, 3]
      },
      {
        companyKey: 'brightflow',
        positionIndex: 0,
        jobTitle: 'Staff Software Engineer',
        displayCompanyName: 'Brightflow.ai #smallcaps[(defunct)]',
        locationLabel: 'New York, NY',
        startDate: '2023-09',
        endDate: '2024-06',
        roleSummary:
          'Designed and implemented a data platform for a Fintech startup, focusing on ETL pipelines, data warehousing, and API integrations',
        bulletIndices: [0, 1, 2, 3, 4]
      },
      {
        companyKey: 'volvo',
        positionIndex: 0,
        jobTitle: 'Tech Lead Manager',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'New York, NY',
        startDate: '2020-03',
        endDate: '2023-04',
        roleSummary:
          'Led the Volvo Valet initiative as technical lead and manager, enabling dealerships to manage bookings, loaner vehicles, and premium services for Volvo owners. Oversaw both B2B and B2C efforts across two web apps, two mobile apps, and a backend platform',
        bulletIndices: [0, 1, 2, 3, 4]
      },
      {
        companyKey: 'volvo',
        positionIndex: 1,
        jobTitle: 'Senior Software Engineer',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'Stockholm, Sweden',
        startDate: '2018-01',
        endDate: '2020-03',
        roleSummary: 'Delivered three complex software solutions with a key focus on backend, DevOps and data science',
        bulletIndices: [8, 9, 10]
      },
      {
        companyKey: 'luxe',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Luxe #smallcaps[(acquired by Volvo Cars)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2016-06',
        endDate: '2017-12',
        roleSummary: 'Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup',
        bulletIndices: [0, 1]
      },
      {
        companyKey: 'streamnation',
        positionIndex: 0,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'StreamNation #smallcaps[(defunct)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2015-12',
        endDate: '2016-06',
        roleSummary: 'Participated in both backend and frontend efforts for StreamNation\u2019s multimedia platform',
        bulletIndices: [0, 1, 2]
      },
      {
        companyKey: 'planorama',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Planorama',
        locationLabel: 'Paris, France',
        startDate: '2014-04',
        endDate: '2015-11',
        roleSummary: 'Accompanied Planorama\u2019s retail management platform through a period of rapid growth',
        bulletIndices: [0, 1]
      },
      {
        companyKey: 'luckycart',
        positionIndex: 0,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'LuckyCart',
        locationLabel: 'Paris, France',
        startDate: '2012-09',
        endDate: '2014-04',
        roleSummary: 'Full-time with Luckycart and executed small side projects',
        bulletIndices: [1, 2, 3]
      }
    ]
  },
  {
    archetypeKey: 'nerd',
    archetypeLabel: 'Nerd',
    archetypeDescription:
      'Highly technical engineer focused on deep, cutting-edge technical work or research — for deep-tech and specialist roles',
    socialNetworks: ['GitHub', 'LinkedIn'],
    educationIndices: [0],
    interestItemOverrides: ['Golang', 'Rust', 'C#'],
    positions: [
      {
        companyKey: 'resortpass',
        positionIndex: 0,
        jobTitle: 'Head of Platform',
        displayCompanyName: 'ResortPass',
        locationLabel: 'New York, NY',
        startDate: '2025-03',
        endDate: '2026-04',
        roleSummary:
          'Built the enterprise foundation at ResortPass, a two-sided marketplace connecting consumers to daycation experiences at premium hotels and resorts. Owned the structural layer of the platform \u2014 stability, security, compliance, and engineering efficiency',
        bulletIndices: [5, 6, 7, 8, 9, 15, 16]
      },
      {
        companyKey: 'lantern',
        positionIndex: 0,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'Stealth Startup #smallcaps[(contract)]',
        locationLabel: 'New York, NY',
        startDate: '2024-09',
        endDate: '2024-11',
        roleSummary:
          'Consulted for an early-stage B2B SaaS startup scaling for growth, addressed stability/performance issues and built a scalable foundation',
        bulletIndices: [0, 1, 2, 3]
      },
      {
        companyKey: 'brightflow',
        positionIndex: 0,
        jobTitle: 'Staff Software Engineer',
        displayCompanyName: 'Brightflow.ai #smallcaps[(defunct)]',
        locationLabel: 'New York, NY',
        startDate: '2023-09',
        endDate: '2024-06',
        roleSummary:
          'Designed and implemented a data platform for a Fintech startup, focusing on ETL pipelines, data warehousing, and API integrations',
        bulletIndices: [0, 1, 2, 3, 4]
      },
      {
        companyKey: 'volvo',
        positionIndex: 0,
        jobTitle: 'Tech Lead Manager',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'New York, NY',
        startDate: '2020-03',
        endDate: '2023-04',
        roleSummary:
          'Led the Volvo Valet initiative as technical lead and manager, enabling dealerships to manage bookings, loaner vehicles, and premium services for Volvo owners. Oversaw both B2B and B2C efforts across two web apps, two mobile apps, and a backend platform',
        bulletIndices: [0, 1, 2, 3, 4]
      },
      {
        companyKey: 'volvo',
        positionIndex: 1,
        jobTitle: 'Senior Software Engineer',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'Stockholm, Sweden',
        startDate: '2018-01',
        endDate: '2020-03',
        roleSummary: 'Delivered three complex software solutions with a key focus on backend, DevOps and data science',
        bulletIndices: [8, 9, 10]
      },
      {
        companyKey: 'luxe',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Luxe #smallcaps[(acquired by Volvo Cars)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2016-06',
        endDate: '2017-12',
        roleSummary: 'Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup',
        bulletIndices: [0, 1]
      },
      {
        companyKey: 'streamnation',
        positionIndex: 0,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'StreamNation #smallcaps[(defunct)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2015-12',
        endDate: '2016-06',
        roleSummary: 'Participated in both backend and frontend efforts for StreamNation\u2019s multimedia platform',
        bulletIndices: [0, 1, 2]
      },
      {
        companyKey: 'planorama',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Planorama',
        locationLabel: 'Paris, France',
        startDate: '2014-04',
        endDate: '2015-11',
        roleSummary: 'Accompanied Planorama\u2019s retail management platform through a period of rapid growth',
        bulletIndices: [0, 1]
      },
      {
        companyKey: 'luckycart',
        positionIndex: 0,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'LuckyCart',
        locationLabel: 'Paris, France',
        startDate: '2012-09',
        endDate: '2014-04',
        roleSummary: 'Full-time with Luckycart and executed small side projects',
        bulletIndices: [1, 2, 3]
      }
    ]
  },
  {
    archetypeKey: 'individual_contributor',
    archetypeLabel: 'IC',
    archetypeDescription:
      'Pure individual contributor — for mid-to-senior engineer roles emphasizing hands-on coding and system design',
    socialNetworks: ['GitHub', 'LinkedIn'],
    educationIndices: [0],
    interestItemOverrides: null,
    positions: [
      {
        companyKey: 'resortpass',
        positionIndex: 0,
        jobTitle: 'Head of Platform',
        displayCompanyName: 'ResortPass',
        locationLabel: 'New York, NY',
        startDate: '2025-03',
        endDate: '2026-04',
        roleSummary:
          'Built the enterprise foundation at ResortPass, a two-sided marketplace connecting consumers to daycation experiences at premium hotels and resorts. Owned the structural layer of the platform \u2014 stability, security, compliance, and engineering efficiency',
        bulletIndices: [5, 6, 7, 8, 9, 15, 16]
      },
      {
        companyKey: 'lantern',
        positionIndex: 0,
        jobTitle: 'Staff Software Engineer',
        displayCompanyName: 'Stealth Startup #smallcaps[(contract)]',
        locationLabel: 'New York, NY',
        startDate: '2024-09',
        endDate: '2024-11',
        roleSummary:
          'Consulted for an early-stage B2B SaaS startup, addressed stability/performance issues and built a scalable foundation',
        bulletIndices: [0, 1, 2, 3]
      },
      {
        companyKey: 'brightflow',
        positionIndex: 0,
        jobTitle: 'Staff Software Engineer',
        displayCompanyName: 'Brightflow.ai #smallcaps[(defunct)]',
        locationLabel: 'New York, NY',
        startDate: '2023-09',
        endDate: '2024-06',
        roleSummary:
          'Designed and implemented a data platform for a Fintech startup, focusing on ETL pipelines, data warehousing, and API integrations',
        bulletIndices: [0, 1, 2, 3, 4]
      },
      {
        companyKey: 'volvo',
        positionIndex: 1,
        jobTitle: 'Senior Software Engineer',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'Stockholm, Sweden',
        startDate: '2018-01',
        endDate: '2020-03',
        roleSummary: 'Delivered three complex software solutions with a key focus on backend, DevOps and data science',
        bulletIndices: [8, 9, 10]
      },
      {
        companyKey: 'luxe',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Luxe #smallcaps[(acquired by Volvo Cars)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2016-06',
        endDate: '2017-12',
        roleSummary: 'Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup',
        bulletIndices: [0, 1]
      },
      {
        companyKey: 'streamnation',
        positionIndex: 0,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'StreamNation #smallcaps[(defunct)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2015-12',
        endDate: '2016-06',
        roleSummary: 'Participated in both backend and frontend efforts for StreamNation\u2019s multimedia platform',
        bulletIndices: [0, 1, 2]
      },
      {
        companyKey: 'planorama',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Planorama',
        locationLabel: 'Paris, France',
        startDate: '2014-04',
        endDate: '2015-11',
        roleSummary: 'Accompanied Planorama\u2019s retail management platform through a period of rapid growth',
        bulletIndices: [0, 1]
      },
      {
        companyKey: 'luckycart',
        positionIndex: 0,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'LuckyCart',
        locationLabel: 'Paris, France',
        startDate: '2012-09',
        endDate: '2014-04',
        roleSummary: 'Full-time with Luckycart and executed small side projects',
        bulletIndices: [1, 2, 3]
      }
    ]
  },
  {
    archetypeKey: 'hands_on_manager',
    archetypeLabel: 'Hands-On Manager',
    archetypeDescription:
      'Technical leader who codes and manages — for architect, staff+, and hands-on engineering manager roles',
    socialNetworks: ['GitHub', 'LinkedIn'],
    educationIndices: [0],
    interestItemOverrides: null,
    positions: [
      {
        companyKey: 'resortpass',
        positionIndex: 0,
        jobTitle: 'Head of Platform',
        displayCompanyName: 'ResortPass',
        locationLabel: 'New York, NY',
        startDate: '2025-03',
        endDate: '2026-04',
        roleSummary:
          'Built the enterprise foundation at ResortPass, a two-sided marketplace connecting consumers to daycation experiences at premium hotels and resorts. Owned the structural layer of the platform \u2014 stability, security, compliance, and engineering efficiency',
        bulletIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
      },
      {
        companyKey: 'lantern',
        positionIndex: 0,
        jobTitle: 'Staff Software Engineer',
        displayCompanyName: 'Stealth Startup #smallcaps[(contract)]',
        locationLabel: 'New York, NY',
        startDate: '2024-09',
        endDate: '2024-11',
        roleSummary:
          'Consulted for an early-stage B2B SaaS startup preparing for growth, addressed stability/performance issues and built a scalable foundation',
        bulletIndices: [0, 1, 2, 3]
      },
      {
        companyKey: 'brightflow',
        positionIndex: 0,
        jobTitle: 'Staff Software Engineer',
        displayCompanyName: 'Brightflow.ai #smallcaps[(defunct)]',
        locationLabel: 'New York, NY',
        startDate: '2023-09',
        endDate: '2024-06',
        roleSummary:
          'Designed and implemented a data platform for a Fintech startup, focusing on ETL pipelines, data warehousing, and API integrations',
        bulletIndices: [0, 1, 2, 3, 4]
      },
      {
        companyKey: 'volvo',
        positionIndex: 0,
        jobTitle: 'Tech Lead Manager',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'New York, NY',
        startDate: '2020-03',
        endDate: '2023-04',
        roleSummary:
          'Led the Volvo Valet initiative as technical lead and manager, overseeing both B2B and B2C efforts across two web apps, two mobile apps, and a backend platform',
        bulletIndices: [0, 1, 2, 3, 4]
      },
      {
        companyKey: 'volvo',
        positionIndex: 1,
        jobTitle: 'Senior Software Engineer',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'Stockholm, Sweden',
        startDate: '2018-01',
        endDate: '2020-03',
        roleSummary: 'Delivered three complex software solutions with a key focus on backend, DevOps and data science',
        bulletIndices: [8, 9, 10]
      },
      {
        companyKey: 'luxe',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Luxe #smallcaps[(acquired by Volvo Cars)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2016-06',
        endDate: '2017-12',
        roleSummary: 'Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup',
        bulletIndices: [0, 1]
      },
      {
        companyKey: 'planorama',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Planorama',
        locationLabel: 'Paris, France',
        startDate: '2014-04',
        endDate: '2015-11',
        roleSummary: 'Accompanied Planorama\u2019s retail management platform through a period of rapid growth',
        bulletIndices: [0, 1]
      }
    ]
  },
  {
    archetypeKey: 'high_level_manager',
    archetypeLabel: 'VP / Director',
    archetypeDescription:
      'Senior engineering leader — for VP, Director, and Head of Engineering roles emphasizing strategy, org building, and business impact',
    socialNetworks: ['LinkedIn'],
    educationIndices: [0],
    interestItemOverrides: null,
    positions: [
      {
        companyKey: 'resortpass',
        positionIndex: 0,
        jobTitle: 'Head of Platform',
        displayCompanyName: 'ResortPass',
        locationLabel: 'New York, NY',
        startDate: '2025-03',
        endDate: '2026-04',
        roleSummary:
          'Built the enterprise foundation at ResortPass, a two-sided marketplace connecting consumers to daycation experiences at premium hotels and resorts. Owned the structural layer of the platform \u2014 stability, security, compliance, and engineering efficiency',
        bulletIndices: [0, 1, 2, 3, 10, 11, 12, 13, 14]
      },
      {
        companyKey: 'volvo',
        positionIndex: 0,
        jobTitle: 'Tech Lead Manager',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'New York, NY',
        startDate: '2020-03',
        endDate: '2023-04',
        roleSummary:
          'Led the Volvo Valet initiative end-to-end, overseeing product, engineering, and cross-functional delivery across two web apps, two mobile apps, and a backend platform',
        bulletIndices: [0, 1, 2, 3, 4]
      },
      {
        companyKey: 'volvo',
        positionIndex: 1,
        jobTitle: 'Senior Software Engineer',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'Stockholm, Sweden',
        startDate: '2018-01',
        endDate: '2020-03',
        roleSummary: 'Delivered three complex software solutions with a key focus on backend, DevOps and data science',
        bulletIndices: [8, 9, 10]
      },
      {
        companyKey: 'luxe',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Luxe #smallcaps[(acquired by Volvo Cars)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2016-06',
        endDate: '2017-12',
        roleSummary: 'Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup',
        bulletIndices: [0, 1]
      },
      {
        companyKey: 'planorama',
        positionIndex: 0,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Planorama',
        locationLabel: 'Paris, France',
        startDate: '2014-04',
        endDate: '2015-11',
        roleSummary: 'Accompanied Planorama\u2019s retail management platform through a period of rapid growth',
        bulletIndices: [0, 1]
      }
    ]
  }
];
