# Sylvain Estevez

## Info
- Linkedin: https://www.linkedin.com/in/sylvain-estevez/
- Email: estevez.sylvain@gmail.com
- Location: New York, NY
- Phone: (415) 619 7821
- GitHub: https://github.com/SylvainEstevez

## About
Engineering leader with 15 years building high-performing teams and delivering data-intensive products and systems. Focused on technical excellence, engineering efficiency, and the AI and infrastructure foundations that steer Series B+ startups towards scability and growth.

I think in systems. Whether I'm designing an architecture or watching how teams ship - I'm always looking for the patterns that slow things down and asking how architecture or automation can quietly fix them.

Over 15 years - at Luxe (acquired by Volvo), Volvo Cars, and ResortPass - I've built systems from zero to multi-region production, led engineering teams across 6 time zones, and shipped products to 20+ markets and 3M+ users.

Most recently at ResortPass, I enabled the company's enterprise evolution - building the platform foundations that stabilized operations, unlocked compliance, and accelerated the entire engineering org.

AI is increasingly central to how I think about engineering - not as a buzzword but as a real lever. I build AI systems that augment engineers, not replace their judgment. I've also had to design the security and governance layer that makes AI adoption safe: data boundaries, access controls, vendor posture, and compliance implications of AI tools in regulated environments.

I work best at the intersection of technical depth and organizational leadership - staying close to architecture and system design while setting direction, hiring, and connecting engineering decisions to business outcomes.

Hands-on is fine by me. I still write code - started at 10 and never really stopped.
Based in NYC · English & French fluent

---

## Experiences

### Head of Platform — ResortPass
*Mar 2025 – Apr 2026 · New York, NY*

Summary: Built the enterprise foundation at ResortPass, a two-sided marketplace connecting consumers to daycation experiences at premium hotels and resorts. Owned the structural layer of the platform - stability, security, compliance, and engineering efficiency

Accomplishments:
- Built and led a platform team of senior specialists serving a 25-engineer org across product engineering, data, and QA as a horizontal enablement function.
- Built a cost-efficient MLOps platform on Airflow and EKS powering dynamic ranking and personalized recommendations, architected to scale to zero when idle and provision on demand.
- Introduced APM and structured logging org-wide, set up automated service and infra monitors, and wired vulnerability detection directly to Jira - closing the loop from discovery to remediation without manual triage.
- Partnered with the VP of Engineering to own the platform roadmap, turning org-wide pain points and improvement opportunities into a structured, prioritized execution plan.
- Acted as de facto architect org-wide - reviewed Technical Design Docs, shaped backend decisions, and guided engineers on architecture to maintain technical consistency across all product teams.
- Led ResortPass through SOC 2 Type I and II - partnered with auditors (Latacora) on Type I policy definition, then owned Type II end-to-end: IT processes, compliance tooling, and control monitoring in Vanta.
- Built a developer enablement platform - CLI with composable skills and commands, AI code review in CI (Claude Code), and Jira integration - automating the full lifecycle from issue creation and branching through PR feedback and merge; tooling updates distributed to all repos via automated PRs from a central repository.
- Enabled a strategic MSA with a top-tier global hospitality group by building the enterprise compliance posture required for procurement: SOC 2, PCI DSS Service Provider certification, privileged access controls, and audit-ready infrastructure.
- Deployed StrongDM as the privileged access layer across all production infrastructure, eliminating direct DB/SSH access and generating a full audit trail for compliance and incident investigations.
- Maintained and scaled the analytics platform (CDC, Redshift, ETL) with secure, audited SSH access for reliable BI and ML data availability.
- Reduced production outages to zero - the platform had seen 2 in 3 months - through reliability improvements, proactive seasonal scaling, and FinOps right-sizing.
- Drove test automation adoption org-wide, establishing standards that eliminated manual verification overhead.
- Owned platform architecture on AWS - service boundaries, data flows, and infrastructure topology - and designed a compliance-driven environment strategy with a dedicated developer sandbox isolated from staging and production.
- Established incident response and on-call practices driven by automated monitors, replacing reactive firefighting with a structured detection-escalation-resolution playbook.
- Embedded automated quality and security gates in every repo (linters, coverage, static analysis, secret detection), raising the engineering baseline for 25 engineers without adding review overhead.
- Led PCI DSS Service Provider compliance from contract negotiation to SAQ-D AOC to unblock a critical MSA, correctly scoping the engagement around Stripe’s card processing delegation.
- Drove recruiting that landed critical senior hires: Engineering Manager, Senior Engineering Manager, and Staff Engineer.

### Software Architect & Technical Advisor — Stealth Startup
*Sep 2024 – Nov 2024 · New York, NY*

Summary: Consulted for an early-stage B2B SaaS startup preparing for growth, addressed stability/performance issues and built a scalable foundation

Accomplishments:
- Built a pipeline to ingest S3-delivered data into ElasticSearch, enabling fast, term-based search and retrieval.
- Selectively optimized SQL queries and revised schemas to resolve performance bottlenecks, increased trigram (pg_trgm) similarity search accuracy from low ~40% to 86%+.
- Leveraged LLMs (OpenAI, Anthropic), prompt engineering, and Playwright-driven web scraping to equip sales teams with prospect insights.
- Enabled local development and CI/CD pipelines: containerized Supabase (PostgreSQL) and BullQ (Redis) using Docker, split existing schema (tables, stored procedures) into manageable SQL migrations, implemented unit testing frameworks and GitHub Actions workflows.

### Senior Engineering Manager — Brightflow.ai
*Sep 2023 – Jun 2024 · New York, NY*

Summary: Designed and implemented a data platform for a Fintech startup, focusing on ETL pipelines, data warehousing, and API integrations

Accomplishments:
- Built an event-driven ETL framework with Node.js, Kafka (MSK), and Kubernetes Job (EKS), prioritizing robustness, scalability, and observability (X-Ray, CloudWatch, OpenTelemetry, Grafana).
- Automated OpenAPI documentation maintenance with Docusaurus using a bottom-up approach, preparing REST APIs for public release during company pivot.
- Instilled a collaboration and feedback culture for technical decisions relying on ADRs (Architecture Decision Records).
- Drove organization-wide alignment on 3 major initiatives, leading to their completion in a timely manner.
- Delivered data to Athena (Apache Presto, S3-indexed) for analytics/ML, Aurora (PostgreSQL) through REST APIs for real-time applications, and complex Excel reports for loan underwriting.
- As SCRUM master, solidified Agile practices across the organization, resulting in increased predictability and transparency.
- Integrated 12+ external APIs (including Plaid, Shopify, Rutter, FB Marketplace, QBO) to ingest and normalize sales, marketing, accounting, and banking data.
- Effectively managed employee under pre-existing PIP and helped them get back on track.
- Fostered a culture of collaboration and accountability in technical decision-making by implementing Architecture Decision Records (ADRs) for transparency and alignment.

### Engineering Manager — Volvo Cars
*Mar 2020 – Apr 2023 · New York, NY*

Summary: Led the Volvo Valet initiative as technical lead and manager, enabling dealerships to manage bookings, loaner vehicles, and premium services for Volvo owners. Oversaw both B2B and B2C efforts across two web apps, two mobile apps, and a backend platform

Accomplishments:
- Collaborated cross-functionally with operations, product, NSCs, and dealerships to streamline dealer workflows and enhance customer experience.
- Monitored system health with Prometheus, Jaeger, and Grafana; set up Slack and PagerDuty alerts to optimize uptime, performance, and incident response.
- Redesigned valet services and asset management using Domain-Driven Design, expanding global availability (20+ markets) by optimizing AWS regions and Route53 geolocation for lower latency and higher uptime.
- Trusted to act as engineering director in the director's absence (35 engineers).
- Developed REST APIs to integrate valet services with the Volvo On Call app, Volvo Cars website, and dealer booking systems.
- Acted as product manager for over a year as we were looking for a replacement.
- Implemented CCPA and GDPR-compliant data redaction and retention policies to ensure legal compliance in the US and EU.
- Grew the team from 4 to 10 engineers spanning backend, frontend, mobile, QA and devops in a 6 timezones remote setup (US East/West Coasts, South America, Europe).

### Senior Software Engineer — Volvo Cars
*Jan 2018 – Mar 2020 · Stockholm, Sweden*

Summary: Delivered three complex software solutions with a key focus on backend, DevOps and data science

Accomplishments:
- Engineered logistics orchestration for a ZipCar-like Volvo Cars subsidiary, transferring knowledge acquired at Luxe and using evolutionary algorithms to enhance efficiency and fully automate vehicle and personnel movement.
- Influenced building Volvo's central infrastructure platform in AWS, cutting costs by leveraging economies of scale and streamlining onboarding for CI/CD, deployment, and resource provisioning.
- Delivered Volvo Valet's initial distributed architecture with Node.js, TypeScript, and MySQL (Aurora), running on Kubernetes behind Amazon API Gateway, launching the product within an aggressive 6-month timeline.

### Lead Software Engineer — Luxe
*Jun 2016 – Dec 2017 · San Francisco, CA*

Summary: Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup

Accomplishments:
- Played a pivotal role in agile development process, including sprint planning, estimation, and retrospectives, establishing transparency and accountability for the engineering organization.
- Piloted the migration from a large vanilla Node.js monolith into manageable TypeScript micro services, improving scalability and providing flexible APIs to frontend engineers.
- In collaboration with the data science team, proposed and implemented a data model for optimizing the orchestration and assignments of valets to customers, resulting in improved operational efficiency and customer satisfaction.

### Software Engineer — StreamNation
*Dec 2015 – Jun 2016 · San Francisco, CA*

Summary: Participated in both backend and frontend efforts for StreamNation’s multimedia platform

Accomplishments:
- Sparked and initiated the development of the responsive web SPA (Angular) using WebSockets.
- Designed and deployed the microservices architecture using Node.js / TypeScript, MongoDB and MySQL.
- Developed a desktop app using NW.js and Electron, delivering a native-like user experience across all platforms.

### Lead Software Engineer — Planorama
*Apr 2014 – Nov 2015 · Paris, France*

Summary: Accompanied Planorama’s retail management platform through a period of rapid growth

Accomplishments:
- Executed contractual SLAs with industry-leading global clients (Coca Cola, Danone, Mondelez), consistently maintaining high performance and worldwide availability; met service level targets, fostering long-term partnerships.
- Hired, trained and managed the web team from 4 to 16 engineers team across 3 locations.
- Architected and coded a 20+ Node.js microservices platform to support a fantastic 5x business growth within a year.
- Promoted 3 team members to tech lead positions, leading to better onboarding of new hires and increased accountability.

### Software Engineer — LuckyCart
*Sep 2012 – Apr 2014 · Paris, France*

Full-time with Luckycart and executed small side projects

- Maintained and scaled the 5 microservices Node.js / Java architecture under the CTO’s guidance.
- Developed a visually appealing, functional website for a Californian restaurant, driving online engagement and customer satisfaction.
- Created 3 online card games for a clairvoyance website, increasing website traffic.
- Delivered an online SAAS mail and web pages editor, enabling users to create and edit professional-looking email templates and pages with ease, all within an Ember.js SPA.

---

## Education

### B.S. in Computer Science — AFPA Créteil
*2012 · Paris, France*

### Certification in Modern Management Techniques — CNFDI Paris
*2008 · Paris, France*

### High School Diploma in Electronics — Lycée de la Mare Carrée
*2003 · Moissy-Cramayel, France*
