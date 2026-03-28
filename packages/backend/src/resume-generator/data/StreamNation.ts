import { CompanyConfig } from './CompanyConfig';

export const StreamNation = CompanyConfig.create({
  name: 'StreamNation',
  mention: 'defunct',
  website: null,
  domain: 'B2C, SAAS, Media Library Management',
  locations: ['San Francisco, CA'],
  dates: {
    joined: '2015-12',
    promoted: null,
    left: '2016-06'
  },
  bullets: [
    // Technical
    'Designed and deployed the microservices architecture using Node.js / TypeScript, MongoDB and MySQL',
    'Sparked and initiated the development of the responsive web SPA (Angular) using WebSockets',
    'Developed a desktop app using NW.js and Electron, delivering a native-like user experience across all platforms'
  ]
});
