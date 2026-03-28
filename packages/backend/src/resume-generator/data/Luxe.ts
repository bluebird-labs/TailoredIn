import { CompanyConfig } from './CompanyConfig';

export const Luxe = CompanyConfig.create({
  name: 'Luxe',
  mention: 'acquired by Volvo Cars',
  website: null,
  domain: 'B2C, B2B, On-Demand Valet Parking, Rental Car Delivery',
  locations: ['San Francisco, CA'],
  dates: {
    joined: '2016-06',
    promoted: null,
    left: '2017-12'
  },
  bullets: [
    // Technical
    'Piloted the migration from a large vanilla Node.js monolith into manageable TypeScript micro services, improving scalability and providing flexible APIs to frontend engineers',
    'In collaboration with the data science team, proposed and implemented a data model for optimizing the orchestration and assignments of valets to customers, resulting in improved operational efficiency and customer satisfaction',

    // Leadership
    'Played a pivotal role in agile development process, including sprint planning, estimation, and retrospectives, establishing transparency and accountability for the engineering organization'
  ]
});
