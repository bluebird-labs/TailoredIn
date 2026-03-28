import { CompanyConfig } from './CompanyConfig.js';

export const Brightflow = CompanyConfig.create({
  name: 'Brightflow.ai',
  mention: 'defunct',
  website: 'https://brightflow.ai/',
  domain: 'B2B, SAAS, Fintech, Loans Underwriting, Cash Flow Management',
  dates: {
    joined: '2023-09',
    promoted: '2024-03',
    left: '2024-06'
  },
  locations: ['New York, NY'],
  bullets: [
    // Technical
    'Built an event-driven ETL framework with Node.js, Kafka (MSK), and Kubernetes Job (EKS), prioritizing robustness, scalability, and observability (X-Ray, CloudWatch, OpenTelemetry, Grafana)',
    'Delivered data to Athena (Apache Presto, S3-indexed) for analytics/ML, Aurora (PostgreSQL) through REST APIs for real-time applications, and complex Excel reports for loan underwriting',
    'Integrated 12+ external APIs (including Plaid, Shopify, Rutter, FB Marketplace, QBO) to ingest and normalize sales, marketing, accounting, and banking data',
    'Automated OpenAPI documentation maintenance with Docusaurus using a bottom-up approach, preparing REST APIs for public release during company pivot',

    // Leadership.
    'Fostered a culture of collaboration and accountability in technical decision-making by implementing Architecture Decision Records (ADRs) for transparency and alignment',
    'Effectively managed employee under pre-existing PIP and helped them get back on track',
    'Instilled a collaboration and feedback culture for technical decisions relying on ADRs (Architecture Decision Records)',
    'As SCRUM master, solidified Agile practices across the organization, resulting in increased predictability and transparency',
    'Drove organization-wide alignment on 3 major initiatives, leading to their completion in a timely manner'
  ]
});
