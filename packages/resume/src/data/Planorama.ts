import { CompanyConfig } from './CompanyConfig.js';

export const Planorama = CompanyConfig.create({
  name: 'Planorama',
  mention: null,
  domain: 'B2B, SAAS, Retail, Image Recognition',
  website: 'https://planorama.com/',
  locations: ['Paris, France'],
  dates: {
    joined: '2014-04',
    promoted: '2014-08',
    left: '2015-11'
  },
  bullets: [
    // Technical
    'Architected and coded a 20+ Node.js microservices platform to support a fantastic 5x business growth within a year',
    'Executed contractual SLAs with industry-leading global clients (Coca Cola, Danone, Mondelez), consistently maintaining high performance and worldwide availability; met service level targets, fostering long-term partnerships',

    // Leadership
    'Hired, trained and managed the web team from 4 to 16 engineers team across 3 locations',
    'Promoted 3 team members to tech lead positions, leading to better onboarding of new hires and increased accountability'
  ]
});
