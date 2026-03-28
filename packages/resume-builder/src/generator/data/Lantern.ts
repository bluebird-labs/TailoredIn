import { CompanyConfig } from './CompanyConfig';

export const Lantern = CompanyConfig.create({
  name: 'Stealth Startup',
  mention: 'contract',
  locations: ['New York, NY'],
  website: null,
  domain: 'B2B, SAAS',
  dates: {
    joined: '2024-09',
    left: '2024-11',
    promoted: null
  },
  bullets: [
    'Leveraged LLMs (OpenAI, Anthropic), prompt engineering, and Playwright-driven web scraping to equip sales teams with prospect insights',
    'Enabled local development and CI pipelines: containerized Supabase (Postgres) and BullQ (Redis) using Docker, split existing schema (tables, stored procedures) into manageable SQL migrations, implemented unit testing frameworks and GitHub Actions workflows',
    'Selectively optimized SQL queries and revised schemas to resolve performance bottlenecks, increased trigram (pg_trgm) similarity search accuracy from low ~40% to 86%+',
    'Built a pipeline to ingest S3-delivered data into ElasticSearch, enabling fast, term-based search and retrieval'
  ]
});
