import { CompanyConfig } from './CompanyConfig.js';

export const LuckyCart = CompanyConfig.create({
  name: 'LuckyCart',
  mention: null,
  domain: 'SAAS, E-Commerce, Marketing, Customer Engagement',
  website: 'https://www.luckycart.com/en/',
  locations: ['Paris, France'],
  dates: {
    joined: '2012-09',
    promoted: null,
    left: '2014-04'
  },
  bullets: [
    'Delivered an online SAAS mail and web pages editor, enabling users to create and edit professional-looking email templates and pages with ease, all within an Ember.js SPA',
    'Maintained and scaled the 5 microservices Node.js / Java architecture under the CTO’s guidance',
    'Created 3 online card games for a clairvoyance website, increasing website traffic',
    'Developed a visually appealing, functional website for a Californian restaurant, driving online engagement and customer satisfaction'
  ]
});
