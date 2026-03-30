import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Logger } from '@tailoredin/core';
import { Archetype } from '../entities/archetypes/Archetype.js';
import { ArchetypeEducation } from '../entities/archetypes/ArchetypeEducation.js';
import { ArchetypePosition } from '../entities/archetypes/ArchetypePosition.js';
import { ArchetypePositionBullet } from '../entities/archetypes/ArchetypePositionBullet.js';
import { ArchetypeSkillCategory } from '../entities/archetypes/ArchetypeSkillCategory.js';
import { ArchetypeSkillItem } from '../entities/archetypes/ArchetypeSkillItem.js';
import { ResumeBullet } from '../entities/resume/ResumeBullet.js';
import { ResumeCompany } from '../entities/resume/ResumeCompany.js';
import { ResumeCompanyLocation } from '../entities/resume/ResumeCompanyLocation.js';
import { ResumeEducation } from '../entities/resume/ResumeEducation.js';
import { ResumeHeadline } from '../entities/resume/ResumeHeadline.js';
import { ResumeSkillCategory } from '../entities/resume/ResumeSkillCategory.js';
import { ResumeSkillItem } from '../entities/resume/ResumeSkillItem.js';
import { User } from '../entities/users/User.js';

export class ResumeDataSeeder extends Seeder {
  public async run(em: EntityManager): Promise<void> {
    // ── 1. User ──────────────────────────────────────────────────────────
    const user = User.create({
      email: 'estevez.sylvain@gmail.com',
      firstName: 'Sylvain',
      lastName: 'Estevez',
      phoneNumber: '+1 415 619 7821',
      githubHandle: 'SylvainEstevez',
      linkedinHandle: 'sylvain-estevez',
      locationLabel: 'New York, NY'
    });
    em.persist(user);

    // ── 2. Resume Companies + Locations + Bullets ────────────────────────
    const companies = this.createCompanies(em, user);
    const bulletsByCompany = this.createBullets(em, companies);

    // ── 3. Education ─────────────────────────────────────────────────────
    const education = this.createEducation(em, user);

    // ── 4. Skill Categories + Items ──────────────────────────────────────
    const { categories, items } = this.createSkills(em, user);

    // ── 5. Headlines ─────────────────────────────────────────────────────
    const headline = ResumeHeadline.create({
      user,
      headlineLabel: 'IC / Lead IC headline',
      summaryText:
        'Experienced software engineer with over a decade of designing and building data-intensive products and platforms. Adept at leading high-performing teams, driving technical excellence, and delivering business-focused solutions. Thrive in fast-paced environments with an ownership mindset and a pragmatic approach to problem-solving.'
    });
    em.persist(headline);

    // ── 6. Archetypes ────────────────────────────────────────────────────
    this.createLeadICArchetype(em, user, headline, companies, bulletsByCompany, education, categories, items);
    this.createNerdArchetype(em, user, headline, companies, bulletsByCompany, education, categories, items);

    await em.flush();
    Logger.create(this.constructor.name).info('Resume data seeded successfully.');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Companies
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private createCompanies(em: EntityManager, user: User) {
    const defs = [
      {
        key: 'lantern',
        companyName: 'Stealth Startup',
        companyMention: 'contract',
        websiteUrl: null,
        businessDomain: 'B2B, SAAS',
        joinedAt: '2024-09',
        leftAt: '2024-11',
        promotedAt: null,
        locations: ['New York, NY']
      },
      {
        key: 'brightflow',
        companyName: 'Brightflow.ai',
        companyMention: 'defunct',
        websiteUrl: 'https://brightflow.ai/',
        businessDomain: 'B2B, SAAS, Fintech, Loans Underwriting, Cash Flow Management',
        joinedAt: '2023-09',
        leftAt: '2024-06',
        promotedAt: '2024-03',
        locations: ['New York, NY']
      },
      {
        key: 'volvo',
        companyName: 'Volvo Cars',
        companyMention: null,
        websiteUrl: 'https://www.volvocars.com/us/',
        businessDomain: 'Automotive, High-End Car Services',
        joinedAt: '2018-01',
        leftAt: '2023-04',
        promotedAt: '2020-03',
        locations: ['New York, NY', 'Stockholm, Sweden']
      },
      {
        key: 'luxe',
        companyName: 'Luxe',
        companyMention: 'acquired by Volvo Cars',
        websiteUrl: null,
        businessDomain: 'B2C, B2B, On-Demand Valet Parking, Rental Car Delivery',
        joinedAt: '2016-06',
        leftAt: '2017-12',
        promotedAt: null,
        locations: ['San Francisco, CA']
      },
      {
        key: 'streamnation',
        companyName: 'StreamNation',
        companyMention: 'defunct',
        websiteUrl: null,
        businessDomain: 'B2C, SAAS, Media Library Management',
        joinedAt: '2015-12',
        leftAt: '2016-06',
        promotedAt: null,
        locations: ['San Francisco, CA']
      },
      {
        key: 'planorama',
        companyName: 'Planorama',
        companyMention: null,
        websiteUrl: 'https://planorama.com/',
        businessDomain: 'B2B, SAAS, Retail, Image Recognition',
        joinedAt: '2014-04',
        leftAt: '2015-11',
        promotedAt: '2014-08',
        locations: ['Paris, France']
      },
      {
        key: 'luckycart',
        companyName: 'LuckyCart',
        companyMention: null,
        websiteUrl: 'https://www.luckycart.com/en/',
        businessDomain: 'SAAS, E-Commerce, Marketing, Customer Engagement',
        joinedAt: '2012-09',
        leftAt: '2014-04',
        promotedAt: null,
        locations: ['Paris, France']
      }
    ] as const;

    const result: Record<string, ResumeCompany> = {};

    for (const def of defs) {
      const company = ResumeCompany.create({
        user,
        companyName: def.companyName,
        companyMention: def.companyMention,
        websiteUrl: def.websiteUrl,
        businessDomain: def.businessDomain,
        joinedAt: def.joinedAt,
        leftAt: def.leftAt,
        promotedAt: def.promotedAt
      });
      em.persist(company);

      for (let i = 0; i < def.locations.length; i++) {
        em.persist(
          ResumeCompanyLocation.create({ resumeCompany: company, locationLabel: def.locations[i], ordinal: i })
        );
      }

      result[def.key] = company;
    }

    return result;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Bullets (master pool per company)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private createBullets(em: EntityManager, companies: Record<string, ResumeCompany>) {
    const bulletDefs: Record<string, string[]> = {
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

    const result: Record<string, ResumeBullet[]> = {};

    for (const [key, texts] of Object.entries(bulletDefs)) {
      result[key] = texts.map((content, i) => {
        const bullet = ResumeBullet.create({ resumeCompany: companies[key], content, ordinal: i });
        em.persist(bullet);
        return bullet;
      });
    }

    return result;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Education
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private createEducation(em: EntityManager, user: User) {
    const defs = [
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
    ];

    return defs.map((def, i) => {
      const edu = ResumeEducation.create({ user, ...def, ordinal: i });
      em.persist(edu);
      return edu;
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Skill Categories + Items
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private createSkills(em: EntityManager, user: User) {
    const stackDefs: [string, string[]][] = [
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

    const categories: Record<string, ResumeSkillCategory> = {};
    const items: Record<string, ResumeSkillItem[]> = {};

    for (let ci = 0; ci < stackDefs.length; ci++) {
      const [catName, skillNames] = stackDefs[ci];
      const cat = ResumeSkillCategory.create({ user, categoryName: catName, ordinal: ci });
      em.persist(cat);
      categories[catName] = cat;

      items[catName] = skillNames.map((skillName, si) => {
        const item = ResumeSkillItem.create({ category: cat, skillName, ordinal: si });
        em.persist(item);
        return item;
      });
    }

    return { categories, items };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LEAD_IC Archetype
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private createLeadICArchetype(
    em: EntityManager,
    user: User,
    headline: ResumeHeadline,
    companies: Record<string, ResumeCompany>,
    bullets: Record<string, ResumeBullet[]>,
    education: ResumeEducation[],
    categories: Record<string, ResumeSkillCategory>,
    _items: Record<string, ResumeSkillItem[]>
  ) {
    const archetype = Archetype.create({
      user,
      archetypeKey: 'leader_individual_contributor',
      archetypeLabel: 'Lead IC',
      archetypeDescription:
        'Experienced engineer who demonstrates leadership and guides teams — for platform, infrastructure, and senior IC roles',
      headline,
      socialNetworks: ['GitHub', 'LinkedIn']
    });
    em.persist(archetype);

    // Education: BS only
    em.persist(ArchetypeEducation.create({ archetype, education: education[0], ordinal: 0 }));

    // All skill categories, same order
    for (const [, cat] of Object.entries(categories)) {
      const asc = ArchetypeSkillCategory.create({ archetype, category: cat, ordinal: cat.ordinal });
      em.persist(asc);

      // All items included (no overrides needed for LEAD_IC since it uses the full set)
      // Exception: interests — LEAD_IC has ['Golang', 'Scala', 'Kotlin', 'Rust', 'C#'] which IS the full set
    }

    // Positions (8 entries, matching LeadICResumeTemplate)
    const positions = [
      {
        company: companies.lantern,
        jobTitle: 'Staff Software Engineer',
        displayCompanyName: 'Stealth Startup #smallcaps[(contract)]',
        locationLabel: 'New York, NY',
        startDate: '2024-09',
        endDate: '2024-11',
        roleSummary:
          'Consulted for an early-stage B2B SaaS startup preparing for growth, addressed stability/performance issues and built a scalable foundation',
        bulletIndices: [0, 1, 2, 3] // all 4 lantern bullets
      },
      {
        company: companies.brightflow,
        jobTitle: 'Staff Software Engineer',
        displayCompanyName: 'Brightflow.ai #smallcaps[(defunct)]',
        locationLabel: 'New York, NY',
        startDate: '2023-09',
        endDate: '2024-06',
        roleSummary:
          'Designed and implemented a data platform for a Fintech startup, focusing on ETL pipelines, data warehousing, and API integrations',
        bulletIndices: [0, 1, 2, 3, 4] // first 5 brightflow bullets
      },
      {
        company: companies.volvo,
        jobTitle: 'Tech Lead Manager',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'New York, NY',
        startDate: '2020-03',
        endDate: '2023-04',
        roleSummary:
          'Led the Volvo Valet initiative as technical lead and manager, enabling dealerships to manage bookings, loaner vehicles, and premium services for Volvo owners. Oversaw both B2B and B2C efforts across two web apps, two mobile apps, and a backend platform',
        bulletIndices: [0, 1, 2, 3, 4] // first 5 volvo bullets (second role: technical)
      },
      {
        company: companies.volvo,
        jobTitle: 'Senior Software Engineer',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'Stockholm, Sweden',
        startDate: '2018-01',
        endDate: '2020-03',
        roleSummary: 'Delivered three complex software solutions with a key focus on backend, DevOps and data science',
        bulletIndices: [8, 9, 10] // volvo first role bullets
      },
      {
        company: companies.luxe,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Luxe #smallcaps[(acquired by Volvo Cars)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2016-06',
        endDate: '2017-12',
        roleSummary: 'Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup',
        bulletIndices: [0, 1] // first 2 luxe bullets
      },
      {
        company: companies.streamnation,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'StreamNation #smallcaps[(defunct)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2015-12',
        endDate: '2016-06',
        roleSummary: 'Participated in both backend and frontend efforts for StreamNation\u2019s multimedia platform',
        bulletIndices: [0, 1, 2]
      },
      {
        company: companies.planorama,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Planorama',
        locationLabel: 'Paris, France',
        startDate: '2014-04',
        endDate: '2015-11',
        roleSummary: 'Accompanied Planorama\u2019s retail management platform through a period of rapid growth',
        bulletIndices: [0, 1]
      },
      {
        company: companies.luckycart,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'LuckyCart',
        locationLabel: 'Paris, France',
        startDate: '2012-09',
        endDate: '2014-04',
        roleSummary: 'Full-time with Luckycart and executed small side projects',
        bulletIndices: [1, 2, 3] // skips bullet 0 ("Delivered an online SAAS mail...")
      }
    ];

    for (let pi = 0; pi < positions.length; pi++) {
      const def = positions[pi];
      const companyKey = Object.entries(companies).find(([, c]) => c === def.company)![0];
      const pos = ArchetypePosition.create({
        archetype,
        resumeCompany: def.company,
        jobTitle: def.jobTitle,
        displayCompanyName: def.displayCompanyName,
        locationLabel: def.locationLabel,
        startDate: def.startDate,
        endDate: def.endDate,
        roleSummary: def.roleSummary,
        ordinal: pi
      });
      em.persist(pos);

      for (let bi = 0; bi < def.bulletIndices.length; bi++) {
        em.persist(
          ArchetypePositionBullet.create({
            position: pos,
            bullet: bullets[companyKey][def.bulletIndices[bi]],
            ordinal: bi
          })
        );
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NERD Archetype
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private createNerdArchetype(
    em: EntityManager,
    user: User,
    headline: ResumeHeadline,
    companies: Record<string, ResumeCompany>,
    bullets: Record<string, ResumeBullet[]>,
    education: ResumeEducation[],
    categories: Record<string, ResumeSkillCategory>,
    items: Record<string, ResumeSkillItem[]>
  ) {
    const archetype = Archetype.create({
      user,
      archetypeKey: 'nerd',
      archetypeLabel: 'Nerd',
      archetypeDescription:
        'Highly technical engineer focused on deep, cutting-edge technical work or research — for deep-tech and specialist roles',
      headline,
      socialNetworks: ['GitHub', 'LinkedIn']
    });
    em.persist(archetype);

    // Education: BS only
    em.persist(ArchetypeEducation.create({ archetype, education: education[0], ordinal: 0 }));

    // All skill categories
    for (const [, cat] of Object.entries(categories)) {
      em.persist(ArchetypeSkillCategory.create({ archetype, category: cat, ordinal: cat.ordinal }));
    }

    // Override interests items for Nerd: ['Go', 'Rust', 'C#'] instead of ['Golang', 'Scala', 'Kotlin', 'Rust', 'C#']
    // Map nerd interests to the corresponding items in the full set
    const interestItems = items.interests;
    const nerdInterestNames = ['Golang', 'Rust', 'C#']; // 'Golang' maps to 'Go' in display but the item is stored as 'Golang'
    const nerdInterests = interestItems.filter(item => nerdInterestNames.includes(item.skillName));
    for (let i = 0; i < nerdInterests.length; i++) {
      em.persist(ArchetypeSkillItem.create({ archetype, item: nerdInterests[i], ordinal: i }));
    }

    // Positions — Nerd uses SOFTWARE_ENGINEER for Lantern (instead of STAFF_ENGINEER)
    // and slightly different summary for Lantern
    const positions = [
      {
        company: companies.lantern,
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
        company: companies.brightflow,
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
        company: companies.volvo,
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
        company: companies.volvo,
        jobTitle: 'Senior Software Engineer',
        displayCompanyName: 'Volvo Cars',
        locationLabel: 'Stockholm, Sweden',
        startDate: '2018-01',
        endDate: '2020-03',
        roleSummary: 'Delivered three complex software solutions with a key focus on backend, DevOps and data science',
        bulletIndices: [8, 9, 10]
      },
      {
        company: companies.luxe,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Luxe #smallcaps[(acquired by Volvo Cars)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2016-06',
        endDate: '2017-12',
        roleSummary: 'Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup',
        bulletIndices: [0, 1]
      },
      {
        company: companies.streamnation,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'StreamNation #smallcaps[(defunct)]',
        locationLabel: 'San Francisco, CA',
        startDate: '2015-12',
        endDate: '2016-06',
        roleSummary: 'Participated in both backend and frontend efforts for StreamNation\u2019s multimedia platform',
        bulletIndices: [0, 1, 2]
      },
      {
        company: companies.planorama,
        jobTitle: 'Lead Software Engineer',
        displayCompanyName: 'Planorama',
        locationLabel: 'Paris, France',
        startDate: '2014-04',
        endDate: '2015-11',
        roleSummary: 'Accompanied Planorama\u2019s retail management platform through a period of rapid growth',
        bulletIndices: [0, 1]
      },
      {
        company: companies.luckycart,
        jobTitle: 'Software Engineer',
        displayCompanyName: 'LuckyCart',
        locationLabel: 'Paris, France',
        startDate: '2012-09',
        endDate: '2014-04',
        roleSummary: 'Full-time with Luckycart and executed small side projects',
        bulletIndices: [1, 2, 3]
      }
    ];

    for (let pi = 0; pi < positions.length; pi++) {
      const def = positions[pi];
      const companyKey = Object.entries(companies).find(([, c]) => c === def.company)![0];
      const pos = ArchetypePosition.create({
        archetype,
        resumeCompany: def.company,
        jobTitle: def.jobTitle,
        displayCompanyName: def.displayCompanyName,
        locationLabel: def.locationLabel,
        startDate: def.startDate,
        endDate: def.endDate,
        roleSummary: def.roleSummary,
        ordinal: pi
      });
      em.persist(pos);

      for (let bi = 0; bi < def.bulletIndices.length; bi++) {
        em.persist(
          ArchetypePositionBullet.create({
            position: pos,
            bullet: bullets[companyKey][def.bulletIndices[bi]],
            ordinal: bi
          })
        );
      }
    }
  }
}
