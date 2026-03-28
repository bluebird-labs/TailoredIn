import { ResumeTemplate }  from './types.js';
import { JobTitle }        from '@tailoredin/db';
import { Lantern } from '../data/Lantern.js';
import { Brightflow } from '../data/Brightflow.js';
import { Volvo } from '../data/Volvo.js';
import { Luxe } from '../data/Luxe.js';
import { StreamNation } from '../data/StreamNation.js';
import { Planorama } from '../data/Planorama.js';
import { LuckyCart } from '../data/LuckyCart.js';

export const LeadICResumeTemplate: ResumeTemplate = {
  social_networks: ['GitHub', 'LinkedIn'],
  education: ['BS'],
  headline:
    'Experienced software engineer with over a decade of designing and building data-intensive products and platforms. Adept at leading high-performing teams, driving technical excellence, and delivering business-focused solutions. Thrive in fast-paced environments with an ownership mindset and a pragmatic approach to problem-solving.',
  stack: {
    architecture: [
      'OOP Principles & Design Patterns',
      'Microservices',
      'ETL',
      'Event-driven',
      'SOA',
      'DDD',
      'REST',
      'GraphQL'
    ],
    backend: ['Node.js (since 2012)', 'TypeScript (expert)', 'Java (rusty)', 'Python (learning)'],
    storage: [
      'PostgreSQL',
      'MySQL',
      'Kafka',
      'BullQ',
      'ElasticSearch',
      'Redis',
      'Presto',
      'Memcache',
      'MongoDB',
      'RabbitMQ'
    ],
    devOps: [
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
    ],
    telemetry: ['Jaeger', 'Zipkin', 'Grafana', 'Kibana', 'Prometheus', 'Splunk'],
    frontend: ['Ember.js', 'Angular.js', 'SCSS', 'SASS', 'React'],
    interests: ['Golang', 'Scala', 'Kotlin', 'Rust', 'C#']
  },
  experience: [
    Lantern.position({
      company: Lantern.nameWithMention(),
      position: JobTitle.STAFF_ENGINEER,
      location: 'New York, NY',
      start_date: Lantern.joined(),
      end_date: Lantern.left(),
      summary:
        'Consulted for an early-stage B2B SaaS startup preparing for growth, addressed stability/performance issues and built a scalable foundation',
      highlights: [
        'Leveraged LLMs (OpenAI, Anthropic), prompt engineering, and Playwright-driven web scraping to equip sales teams with prospect insights',
        'Enabled local development and CI/CD pipelines: containerized Supabase (PostgreSQL) and BullQ (Redis) using Docker, split existing schema (tables, stored procedures) into manageable SQL migrations, implemented unit testing frameworks and GitHub Actions workflows',
        'Selectively optimized SQL queries and revised schemas to resolve performance bottlenecks, increased trigram (pg_trgm) similarity search accuracy from low ~40% to 86%+',
        'Built a pipeline to ingest S3-delivered data into ElasticSearch, enabling fast, term-based search and retrieval'
      ]
    }),
    Brightflow.position({
      company: Brightflow.nameWithMention(),
      position: JobTitle.STAFF_ENGINEER,
      location: 'New York, NY',
      start_date: Brightflow.joined(),
      end_date: Brightflow.left(),
      summary:
        'Designed and implemented a data platform for a Fintech startup, focusing on ETL pipelines, data warehousing, and API integrations',
      highlights: [
        'Built an event-driven ETL framework with Node.js, Kafka (MSK), and Kubernetes Job (EKS), prioritizing robustness, scalability, and observability (X-Ray, CloudWatch, OpenTelemetry, Grafana)',
        'Delivered data to Athena (Apache Presto, S3-indexed) for analytics/ML, Aurora (PostgreSQL) through REST APIs for real-time applications, and complex Excel reports for loan underwriting',
        'Integrated 12+ external APIs (including Plaid, Shopify, Rutter, FB Marketplace, QBO) to ingest and normalize sales, marketing, accounting, and banking data',
        'Automated OpenAPI documentation maintenance with Docusaurus using a bottom-up approach, preparing REST APIs for public release during company pivot',
        'Fostered a culture of collaboration and accountability in technical decision-making by implementing Architecture Decision Records (ADRs) for transparency and alignment'
      ]
    }),
    Volvo.position({
      company: Volvo.nameWithMention(),
      position: JobTitle.TECH_LEAD_MANAGER,
      location: 'New York, NY',
      start_date: Volvo.promoted(),
      end_date: Volvo.left(),
      summary:
        'Led the Volvo Valet initiative as technical lead and manager, enabling dealerships to manage bookings, loaner vehicles, and premium services for Volvo owners. Oversaw both B2B and B2C efforts across two web apps, two mobile apps, and a backend platform',
      highlights: [
        'Redesigned valet services and asset management using Domain-Driven Design, expanding global availability (20+ markets) by optimizing AWS regions and Route53 geolocation for lower latency and higher uptime',
        'Collaborated cross-functionally with operations, product, NSCs, and dealerships to streamline dealer workflows and enhance customer experience',
        'Developed REST APIs to integrate valet services with the Volvo On Call app, Volvo Cars website, and dealer booking systems',
        'Implemented CCPA and GDPR-compliant data redaction and retention policies to ensure legal compliance in the US and EU',
        'Monitored system health with Prometheus, Jaeger, and Grafana; set up Slack and PagerDuty alerts to optimize uptime, performance, and incident response'
      ]
    }),
    Volvo.position({
      company: Volvo.nakedName(),
      position: JobTitle.SENIOR_ENGINEER,
      location: 'Stockholm, Sweden',
      start_date: Volvo.joined(),
      end_date: Volvo.promoted(),
      summary: 'Delivered three complex software solutions with a key focus on backend, DevOps and data science',
      highlights: [
        'Delivered Volvo Valet’s initial distributed architecture with Node.js, TypeScript, and MySQL (Aurora), running on Kubernetes behind Amazon API Gateway, launching the product within an aggressive 6-month timeline',
        'Engineered logistics orchestration for a ZipCar-like Volvo Cars subsidiary, transferring knowledge acquired at Luxe and using evolutionary algorithms to enhance efficiency and fully automate vehicle and personnel movement',
        'Influenced building Volvo’s central infrastructure platform in AWS, cutting costs by leveraging economies of scale and streamlining onboarding for CI/CD, deployment, and resource provisioning'
      ]
    }),
    Luxe.position({
      company: Luxe.nameWithMention(),
      position: JobTitle.LEAD_ENGINEER,
      location: 'San Francisco, CA',
      start_date: Luxe.joined(),
      end_date: Luxe.left(),
      summary: 'Powered on-demand valet services and rental car delivery for Luxe, a high-growth startup',
      highlights: [
        'Piloted the migration from a large vanilla Node.js monolith into manageable TypeScript micro services, improving scalability and providing flexible APIs to frontend engineers',
        'In collaboration with the data science team, proposed and implemented a data model for optimizing the orchestration and assignments of valets to customers, resulting in improved operational efficiency and customer satisfaction'
      ]
    }),
    StreamNation.position({
      company: StreamNation.nameWithMention(),
      position: JobTitle.SOFTWARE_ENGINEER,
      location: 'San Francisco, CA',
      start_date: StreamNation.joined(),
      end_date: StreamNation.left(),
      summary: 'Participated in both backend and frontend efforts for StreamNation’s multimedia platform',
      highlights: [
        'Designed and deployed the microservices architecture using Node.js / TypeScript, MongoDB and MySQL',
        'Sparked and initiated the development of the responsive web SPA (Angular) using WebSockets',
        'Developed a desktop app using NW.js and Electron, delivering a native-like user experience across all platforms'
      ]
    }),
    Planorama.position({
      company: Planorama.nameWithMention(),
      position: JobTitle.LEAD_ENGINEER,
      location: 'Paris, France',
      start_date: Planorama.joined(),
      end_date: Planorama.left(),
      summary: 'Accompanied Planorama’s retail management platform through a period of rapid growth',
      highlights: [
        'Architected and coded a 20+ Node.js microservices platform to support a fantastic 5x business growth within a year',
        'Executed contractual SLAs with industry-leading global clients (Coca Cola, Danone, Mondelez), consistently maintaining high performance and worldwide availability; met service level targets, fostering long-term partnerships'
      ]
    }),
    LuckyCart.position({
      company: LuckyCart.nameWithMention(),
      position: JobTitle.SOFTWARE_ENGINEER,
      location: 'Paris, France',
      start_date: LuckyCart.joined(),
      end_date: LuckyCart.left(),
      summary: 'Full-time with Luckycart and executed small side projects',
      highlights: [
        'Maintained and scaled the 5 microservices Node.js / Java architecture under the CTO’s guidance',
        'Created 3 online card games for a clairvoyance website, increasing website traffic',
        'Developed a visually appealing, functional website for a Californian restaurant, driving online engagement and customer satisfaction'
      ]
    })
  ]
};
