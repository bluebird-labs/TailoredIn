import { Migration } from '@mikro-orm/migrations';

const PROFILE_ID = '11111111-1111-4000-8000-000000000001';

const EXP_RESORTPASS = '22222222-0000-4000-8000-000000000001';
const EXP_STEALTH = '22222222-0000-4000-8000-000000000002';
const EXP_BRIGHTFLOW = '22222222-0000-4000-8000-000000000003';
const EXP_VOLVO_EM = '22222222-0000-4000-8000-000000000004';
const EXP_VOLVO_SSE = '22222222-0000-4000-8000-000000000005';
const EXP_LUXE = '22222222-0000-4000-8000-000000000006';
const EXP_STREAMNATION = '22222222-0000-4000-8000-000000000007';
const EXP_PLANORAMA = '22222222-0000-4000-8000-000000000008';
const EXP_LUCKYCART = '22222222-0000-4000-8000-000000000009';

/* eslint-disable max-lines-per-function */
export class Migration_20260414000000_seed_profile_data extends Migration {
  override async up(): Promise<void> {
    // ── Clean existing data ──────────────────────────────────────────
    this.addSql(`DELETE FROM "accomplishments" WHERE "experience_id" IN (SELECT "id" FROM "experiences" WHERE "profile_id" = '${PROFILE_ID}');`);
    this.addSql(`DELETE FROM "experiences" WHERE "profile_id" = '${PROFILE_ID}';`);
    this.addSql(`DELETE FROM "educations" WHERE "profile_id" = '${PROFILE_ID}';`);

    // ── Profile ──────────────────────────────────────────────────────
    this.addSql(`
      INSERT INTO "profiles" ("id", "email", "first_name", "last_name", "about", "phone", "location", "linkedin_url", "github_url", "website_url", "created_at", "updated_at")
      VALUES (
        '${PROFILE_ID}',
        'estevez.sylvain@gmail.com',
        'Sylvain',
        'Estevez',
        'Engineering leader with 15 years building high-performing teams and delivering data-intensive products and systems. Focused on technical excellence, engineering efficiency, and the AI and infrastructure foundations that steer Series B+ startups towards scability and growth.

I think in systems. Whether I''m designing an architecture or watching how teams ship - I''m always looking for the patterns that slow things down and asking how architecture or automation can quietly fix them.

Over 15 years - at Luxe (acquired by Volvo), Volvo Cars, and ResortPass - I''ve built systems from zero to multi-region production, led engineering teams across 6 time zones, and shipped products to 20+ markets and 3M+ users.

Most recently at ResortPass, I enabled the company''s enterprise evolution - building the platform foundations that stabilized operations, unlocked compliance, and accelerated the entire engineering org.

AI is increasingly central to how I think about engineering - not as a buzzword but as a real lever. I build AI systems that augment engineers, not replace their judgment. I''ve also had to design the security and governance layer that makes AI adoption safe: data boundaries, access controls, vendor posture, and compliance implications of AI tools in regulated environments.

I work best at the intersection of technical depth and organizational leadership - staying close to architecture and system design while setting direction, hiring, and connecting engineering decisions to business outcomes.

Hands-on is fine by me. I still write code - started at 10 and never really stopped.
Based in NYC · English & French fluent',
        '(415) 619 7821',
        'New York, NY',
        'https://www.linkedin.com/in/sylvain-estevez/',
        'https://github.com/SylvainEstevez',
        NULL,
        NOW(), NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "email"        = EXCLUDED."email",
        "first_name"   = EXCLUDED."first_name",
        "last_name"    = EXCLUDED."last_name",
        "about"        = EXCLUDED."about",
        "phone"        = EXCLUDED."phone",
        "location"     = EXCLUDED."location",
        "linkedin_url" = EXCLUDED."linkedin_url",
        "github_url"   = EXCLUDED."github_url",
        "website_url"  = EXCLUDED."website_url",
        "updated_at"   = NOW();
    `);

    // ── Experiences ──────────────────────────────────────────────────
    this.addSql(`
      INSERT INTO "experiences" ("id", "profile_id", "title", "company_name", "company_website", "location", "start_date", "end_date", "summary", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        ('${EXP_RESORTPASS}', '${PROFILE_ID}', 'Head of Platform', 'ResortPass', NULL, 'New York, NY', '2025-03', '2026-04',
         'Built the enterprise foundation at ResortPass, a two-sided marketplace connecting consumers to daycation experiences at premium hotels and resorts. Owned the structural layer of the platform - stability, security, compliance, and engineering efficiency',
         NULL, 0, NOW(), NOW()),

        ('${EXP_STEALTH}', '${PROFILE_ID}', 'Software Architect & Technical Advisor', 'Stealth Startup', NULL, 'New York, NY', '2024-09', '2024-11',
         'Consulted for an early-stage B2B SaaS startup preparing for growth, addressed stability/performance issues and built a scalable foundation',
         NULL, 1, NOW(), NOW()),

        ('${EXP_BRIGHTFLOW}', '${PROFILE_ID}', 'Senior Engineering Manager', 'Brightflow.ai', NULL, 'New York, NY', '2023-09', '2024-06',
         'Designed and implemented a data platform for a Fintech startup, focusing on ETL pipelines, data warehousing, and API integrations',
         NULL, 2, NOW(), NOW()),

        ('${EXP_VOLVO_EM}', '${PROFILE_ID}', 'Engineering Manager', 'Volvo Cars', NULL, 'New York, NY', '2020-03', '2023-04',
         'Led the Volvo Valet initiative as technical lead and manager, enabling dealerships to manage bookings, loaner vehicles, and premium services for Volvo owners. Oversaw both B2B and B2C efforts across two web apps, two mobile apps, and a backend platform',
         NULL, 3, NOW(), NOW()),

        ('${EXP_VOLVO_SSE}', '${PROFILE_ID}', 'Senior Software Engineer', 'Volvo Cars', NULL, 'Stockholm, Sweden', '2018-01', '2020-03',
         'Delivered three complex software solutions with a key focus on backend, DevOps and data science',
         NULL, 4, NOW(), NOW()),

        ('${EXP_LUXE}', '${PROFILE_ID}', 'Lead Software Engineer', 'Luxe', NULL, 'San Francisco, CA', '2016-06', '2017-12',
         'Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup',
         NULL, 5, NOW(), NOW()),

        ('${EXP_STREAMNATION}', '${PROFILE_ID}', 'Software Engineer', 'StreamNation', NULL, 'San Francisco, CA', '2015-12', '2016-06',
         'Participated in both backend and frontend efforts for StreamNation''s multimedia platform',
         NULL, 6, NOW(), NOW()),

        ('${EXP_PLANORAMA}', '${PROFILE_ID}', 'Lead Software Engineer', 'Planorama', NULL, 'Paris, France', '2014-04', '2015-11',
         'Accompanied Planorama''s retail management platform through a period of rapid growth',
         NULL, 7, NOW(), NOW()),

        ('${EXP_LUCKYCART}', '${PROFILE_ID}', 'Software Engineer', 'LuckyCart', NULL, 'Paris, France', '2012-09', '2014-04',
         'Full-time with LuckyCart and executed small side projects',
         NULL, 8, NOW(), NOW());
    `);

    // ── Accomplishments ──────────────────────────────────────────────

    // ResortPass (18 accomplishments)
    this.addSql(`
      INSERT INTO "accomplishments" ("id", "experience_id", "title", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Built platform team',
         'Built and led a platform team of senior specialists serving a 25-engineer org across product engineering, data, and QA as a horizontal enablement function.',
         0, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'MLOps platform on EKS',
         'Built a cost-efficient MLOps platform on Airflow and EKS powering dynamic ranking and personalized recommendations, architected to scale to zero when idle and provision on demand.',
         1, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Org-wide observability rollout',
         'Introduced APM and structured logging org-wide, set up automated service and infra monitors, and wired vulnerability detection directly to Jira - closing the loop from discovery to remediation without manual triage.',
         2, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Platform roadmap ownership',
         'Partnered with the VP of Engineering to own the platform roadmap, turning org-wide pain points and improvement opportunities into a structured, prioritized execution plan.',
         3, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'De facto org-wide architect',
         'Acted as de facto architect org-wide - reviewed Technical Design Docs, shaped backend decisions, and guided engineers on architecture to maintain technical consistency across all product teams.',
         4, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'SOC 2 Type I and II',
         'Led ResortPass through SOC 2 Type I and II - partnered with auditors (Latacora) on Type I policy definition, then owned Type II end-to-end: IT processes, compliance tooling, and control monitoring in Vanta.',
         5, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Developer enablement platform',
         'Built a developer enablement platform - CLI with composable skills and commands, AI code review in CI (Claude Code), and Jira integration - automating the full lifecycle from issue creation and branching through PR feedback and merge; tooling updates distributed to all repos via automated PRs from a central repository.',
         6, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Enterprise MSA compliance',
         'Enabled a strategic MSA with a top-tier global hospitality group by building the enterprise compliance posture required for procurement: SOC 2, PCI DSS Service Provider certification, privileged access controls, and audit-ready infrastructure.',
         7, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'StrongDM privileged access',
         'Deployed StrongDM as the privileged access layer across all production infrastructure, eliminating direct DB/SSH access and generating a full audit trail for compliance and incident investigations.',
         8, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Analytics platform maintenance',
         'Maintained and scaled the analytics platform (CDC, Redshift, ETL) with secure, audited SSH access for reliable BI and ML data availability.',
         9, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Zero production outages',
         'Reduced production outages to zero - the platform had seen 2 in 3 months - through reliability improvements, proactive seasonal scaling, and FinOps right-sizing.',
         10, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Test automation adoption',
         'Drove test automation adoption org-wide, establishing standards that eliminated manual verification overhead.',
         11, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'AWS platform architecture',
         'Owned platform architecture on AWS - service boundaries, data flows, and infrastructure topology - and designed a compliance-driven environment strategy with a dedicated developer sandbox isolated from staging and production.',
         12, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Incident response practices',
         'Established incident response and on-call practices driven by automated monitors, replacing reactive firefighting with a structured detection-escalation-resolution playbook.',
         13, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Automated quality gates',
         'Embedded automated quality and security gates in every repo (linters, coverage, static analysis, secret detection), raising the engineering baseline for 25 engineers without adding review overhead.',
         14, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'PCI DSS compliance',
         'Led PCI DSS Service Provider compliance from contract negotiation to SAQ-D AOC to unblock a critical MSA, correctly scoping the engagement around Stripe''s card processing delegation.',
         15, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_RESORTPASS}', 'Senior recruiting',
         'Drove recruiting that landed critical senior hires: Engineering Manager, Senior Engineering Manager, and Staff Engineer.',
         16, NOW(), NOW());
    `);

    // Stealth Startup (4 accomplishments)
    this.addSql(`
      INSERT INTO "accomplishments" ("id", "experience_id", "title", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${EXP_STEALTH}', 'S3-to-ElasticSearch pipeline',
         'Built a pipeline to ingest S3-delivered data into ElasticSearch, enabling fast, term-based search and retrieval.',
         0, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_STEALTH}', 'Query optimization and pg_trgm',
         'Selectively optimized SQL queries and revised schemas to resolve performance bottlenecks, increased trigram (pg_trgm) similarity search accuracy from low ~40% to 86%+.',
         1, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_STEALTH}', 'LLM-powered prospect insights',
         'Leveraged LLMs (OpenAI, Anthropic), prompt engineering, and Playwright-driven web scraping to equip sales teams with prospect insights.',
         2, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_STEALTH}', 'Local dev and CI/CD setup',
         'Enabled local development and CI/CD pipelines: containerized Supabase (PostgreSQL) and BullQ (Redis) using Docker, split existing schema (tables, stored procedures) into manageable SQL migrations, implemented unit testing frameworks and GitHub Actions workflows.',
         3, NOW(), NOW());
    `);

    // Brightflow.ai (9 accomplishments)
    this.addSql(`
      INSERT INTO "accomplishments" ("id", "experience_id", "title", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${EXP_BRIGHTFLOW}', 'Event-driven ETL framework',
         'Built an event-driven ETL framework with Node.js, Kafka (MSK), and Kubernetes Job (EKS), prioritizing robustness, scalability, and observability (X-Ray, CloudWatch, OpenTelemetry, Grafana).',
         0, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_BRIGHTFLOW}', 'Automated OpenAPI docs',
         'Automated OpenAPI documentation maintenance with Docusaurus using a bottom-up approach, preparing REST APIs for public release during company pivot.',
         1, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_BRIGHTFLOW}', 'ADR-driven decision culture',
         'Instilled a collaboration and feedback culture for technical decisions relying on ADRs (Architecture Decision Records).',
         2, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_BRIGHTFLOW}', 'Org-wide initiative alignment',
         'Drove organization-wide alignment on 3 major initiatives, leading to their completion in a timely manner.',
         3, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_BRIGHTFLOW}', 'Multi-target data delivery',
         'Delivered data to Athena (Apache Presto, S3-indexed) for analytics/ML, Aurora (PostgreSQL) through REST APIs for real-time applications, and complex Excel reports for loan underwriting.',
         4, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_BRIGHTFLOW}', 'Agile practice solidification',
         'As SCRUM master, solidified Agile practices across the organization, resulting in increased predictability and transparency.',
         5, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_BRIGHTFLOW}', '12+ API integrations',
         'Integrated 12+ external APIs (including Plaid, Shopify, Rutter, FB Marketplace, QBO) to ingest and normalize sales, marketing, accounting, and banking data.',
         6, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_BRIGHTFLOW}', 'PIP employee recovery',
         'Effectively managed employee under pre-existing PIP and helped them get back on track.',
         7, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_BRIGHTFLOW}', 'Collaboration and accountability',
         'Fostered a culture of collaboration and accountability in technical decision-making by implementing Architecture Decision Records (ADRs) for transparency and alignment.',
         8, NOW(), NOW());
    `);

    // Volvo Cars — Engineering Manager (8 accomplishments)
    this.addSql(`
      INSERT INTO "accomplishments" ("id", "experience_id", "title", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${EXP_VOLVO_EM}', 'Cross-functional collaboration',
         'Collaborated cross-functionally with operations, product, NSCs, and dealerships to streamline dealer workflows and enhance customer experience.',
         0, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_VOLVO_EM}', 'System health monitoring',
         'Monitored system health with Prometheus, Jaeger, and Grafana; set up Slack and PagerDuty alerts to optimize uptime, performance, and incident response.',
         1, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_VOLVO_EM}', 'DDD redesign for global scale',
         'Redesigned valet services and asset management using Domain-Driven Design, expanding global availability (20+ markets) by optimizing AWS regions and Route53 geolocation for lower latency and higher uptime.',
         2, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_VOLVO_EM}', 'Acting engineering director',
         'Trusted to act as engineering director in the director''s absence (35 engineers).',
         3, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_VOLVO_EM}', 'Valet services REST APIs',
         'Developed REST APIs to integrate valet services with the Volvo On Call app, Volvo Cars website, and dealer booking systems.',
         4, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_VOLVO_EM}', 'Interim product manager',
         'Acted as product manager for over a year as we were looking for a replacement.',
         5, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_VOLVO_EM}', 'CCPA and GDPR compliance',
         'Implemented CCPA and GDPR-compliant data redaction and retention policies to ensure legal compliance in the US and EU.',
         6, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_VOLVO_EM}', 'Team growth to 10 engineers',
         'Grew the team from 4 to 10 engineers spanning backend, frontend, mobile, QA and devops in a 6 timezones remote setup (US East/West Coasts, South America, Europe).',
         7, NOW(), NOW());
    `);

    // Volvo Cars — Senior Software Engineer (3 accomplishments)
    this.addSql(`
      INSERT INTO "accomplishments" ("id", "experience_id", "title", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${EXP_VOLVO_SSE}', 'Logistics orchestration system',
         'Engineered logistics orchestration for a ZipCar-like Volvo Cars subsidiary, transferring knowledge acquired at Luxe and using evolutionary algorithms to enhance efficiency and fully automate vehicle and personnel movement.',
         0, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_VOLVO_SSE}', 'Central AWS infrastructure',
         'Influenced building Volvo''s central infrastructure platform in AWS, cutting costs by leveraging economies of scale and streamlining onboarding for CI/CD, deployment, and resource provisioning.',
         1, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_VOLVO_SSE}', 'Valet distributed architecture',
         'Delivered Volvo Valet''s initial distributed architecture with Node.js, TypeScript, and MySQL (Aurora), running on Kubernetes behind Amazon API Gateway, launching the product within an aggressive 6-month timeline.',
         2, NOW(), NOW());
    `);

    // Luxe (3 accomplishments)
    this.addSql(`
      INSERT INTO "accomplishments" ("id", "experience_id", "title", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${EXP_LUXE}', 'Agile process leadership',
         'Played a pivotal role in agile development process, including sprint planning, estimation, and retrospectives, establishing transparency and accountability for the engineering organization.',
         0, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_LUXE}', 'Monolith-to-microservices migration',
         'Piloted the migration from a large vanilla Node.js monolith into manageable TypeScript micro services, improving scalability and providing flexible APIs to frontend engineers.',
         1, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_LUXE}', 'Valet assignment optimization',
         'In collaboration with the data science team, proposed and implemented a data model for optimizing the orchestration and assignments of valets to customers, resulting in improved operational efficiency and customer satisfaction.',
         2, NOW(), NOW());
    `);

    // StreamNation (3 accomplishments)
    this.addSql(`
      INSERT INTO "accomplishments" ("id", "experience_id", "title", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${EXP_STREAMNATION}', 'Responsive web SPA',
         'Sparked and initiated the development of the responsive web SPA (Angular) using WebSockets.',
         0, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_STREAMNATION}', 'Microservices architecture',
         'Designed and deployed the microservices architecture using Node.js / TypeScript, MongoDB and MySQL.',
         1, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_STREAMNATION}', 'Cross-platform desktop app',
         'Developed a desktop app using NW.js and Electron, delivering a native-like user experience across all platforms.',
         2, NOW(), NOW());
    `);

    // Planorama (4 accomplishments)
    this.addSql(`
      INSERT INTO "accomplishments" ("id", "experience_id", "title", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${EXP_PLANORAMA}', 'Global client SLA execution',
         'Executed contractual SLAs with industry-leading global clients (Coca Cola, Danone, Mondelez), consistently maintaining high performance and worldwide availability; met service level targets, fostering long-term partnerships.',
         0, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_PLANORAMA}', 'Team growth 4 to 16',
         'Hired, trained and managed the web team from 4 to 16 engineers team across 3 locations.',
         1, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_PLANORAMA}', '20+ microservices platform',
         'Architected and coded a 20+ Node.js microservices platform to support a fantastic 5x business growth within a year.',
         2, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_PLANORAMA}', 'Tech lead promotions',
         'Promoted 3 team members to tech lead positions, leading to better onboarding of new hires and increased accountability.',
         3, NOW(), NOW());
    `);

    // LuckyCart (4 accomplishments)
    this.addSql(`
      INSERT INTO "accomplishments" ("id", "experience_id", "title", "narrative", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${EXP_LUCKYCART}', 'Microservices maintenance',
         'Maintained and scaled the 5 microservices Node.js / Java architecture under the CTO''s guidance.',
         0, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_LUCKYCART}', 'Restaurant website',
         'Developed a visually appealing, functional website for a Californian restaurant, driving online engagement and customer satisfaction.',
         1, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_LUCKYCART}', 'Online card games',
         'Created 3 online card games for a clairvoyance website, increasing website traffic.',
         2, NOW(), NOW()),

        (gen_random_uuid(), '${EXP_LUCKYCART}', 'SaaS mail and page editor',
         'Delivered an online SaaS mail and web pages editor, enabling users to create and edit professional-looking email templates and pages with ease, all within an Ember.js SPA.',
         3, NOW(), NOW());
    `);

    // ── Educations ───────────────────────────────────────────────────
    this.addSql(`
      INSERT INTO "educations" ("id", "profile_id", "degree_title", "institution_name", "graduation_year", "location", "honors", "ordinal", "created_at", "updated_at")
      VALUES
        (gen_random_uuid(), '${PROFILE_ID}', 'B.S. in Computer Science', 'AFPA Créteil', 2012, 'Paris, France', NULL, 0, NOW(), NOW()),
        (gen_random_uuid(), '${PROFILE_ID}', 'Certification in Modern Management Techniques', 'CNFDI Paris', 2008, 'Paris, France', NULL, 1, NOW(), NOW()),
        (gen_random_uuid(), '${PROFILE_ID}', 'High School Diploma in Electronics', 'Lycée de la Mare Carrée', 2003, 'Moissy-Cramayel, France', NULL, 2, NOW(), NOW());
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`DELETE FROM "accomplishments" WHERE "experience_id" IN (SELECT "id" FROM "experiences" WHERE "profile_id" = '${PROFILE_ID}');`);
    this.addSql(`DELETE FROM "experiences" WHERE "profile_id" = '${PROFILE_ID}';`);
    this.addSql(`DELETE FROM "educations" WHERE "profile_id" = '${PROFILE_ID}';`);
    this.addSql(`DELETE FROM "profiles" WHERE "id" = '${PROFILE_ID}';`);
  }
}
