import { CompanyConfig } from './CompanyConfig.js';

export const Volvo = CompanyConfig.create({
  name: 'Volvo Cars',
  mention: null,
  domain: 'Automotive, High-End Car Services',
  website: 'https://www.volvocars.com/us/',
  locations: ['New York, NY', 'Stockholm, Sweden'],
  dates: {
    joined: '2018-01',
    promoted: '2020-03',
    left: '2023-04'
  },
  bullets: [
    // Second role: technical
    'Redesigned valet services and asset management using Domain-Driven Design, expanding global availability (20+ markets) by optimizing AWS regions and Route53 geolocation for lower latency and higher uptime',
    'Collaborated cross-functionally with operations, product, NSCs, and dealerships to streamline dealer workflows and enhance customer experience',
    'Developed REST APIs to integrate valet services with the Volvo On Call app, Volvo Cars website, and dealer booking systems',
    'Implemented CCPA and GDPR-compliant data redaction and retention policies to ensure legal compliance in the US and EU',
    'Monitored system health with Prometheus, Jaeger, and Grafana; set up Slack and PagerDuty alerts to optimize uptime, performance, and incident response',

    // Second role: leadership
    'Grew the team from 4 to 10 engineers spanning backend, frontend, mobile, QA and devops in a 6 timezones remote setup (US East/West Coasts, South America, Europe)',
    'Acted as product manager for over a year as we were looking for a replacement',
    'Trusted to act as engineering director in the director’s absence (35 engineers)',

    // First role
    'Delivered Volvo Valet’s initial distributed architecture with Node.js, TypeScript, and MySQL (Aurora), running on Kubernetes behind Amazon API Gateway, launching the product within an aggressive 6-month timeline',
    'Engineered logistics orchestration for a ZipCar-like Volvo Cars subsidiary, transferring knowledge acquired at Luxe and using evolutionary algorithms to enhance efficiency and fully automate vehicle and personnel movement',
    'Influenced building Volvo’s central infrastructure platform in AWS, cutting costs by leveraging economies of scale and streamlining onboarding for CI/CD, deployment, and resource provisioning'
  ]
});
