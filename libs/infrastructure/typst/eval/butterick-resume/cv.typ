#import "@preview/butterick-resume:0.1.0": *

#show: template

#set page(
  footer: {
    set align(center)
    set text(size: 10pt, tracking: 0.1em)
    context upper[Sylvain Estevez --- Résumé]
  },
  footer-descent: 0.75in,
)

#introduction(
  name: [Sylvain Estevez],
  details: [
    New York, NY \
    #link("tel:+12125551234")[(212) 555-1234] #sym.dot.c #link("mailto:sylvain@estevez.dev")[sylvain\@estevez.dev] #sym.dot.c #link("https://linkedin.com/in/sylvainestevez")[linkedin.com/in/sylvainestevez]
  ],
)

= Executive Summary

Engineering executive with 15+ years of experience building and scaling high-performance teams across fintech, SaaS, and developer tools. Track record of growing organizations from 20 to 150+ engineers, driving platform modernization, and delivering products that serve millions of users. Deep technical background in distributed systems and cloud-native architecture, combined with a strategic focus on operational excellence and talent development.

= Experience

#two-grid(
  left: [Meridian Financial Technologies],
  right: [2021--Present],
)
_Vice President of Engineering_
- Lead a 120-person engineering organization across six product squads, responsible for the core trading platform processing \$2B+ in daily transaction volume
- Drove migration from monolithic architecture to event-driven microservices, reducing deployment cycle times from weeks to hours and improving system uptime to 99.99%
- Established engineering-wide OKR framework and career ladders, reducing attrition from 22% to 9% over two years
- Partnered with CPO and CTO to define three-year technology roadmap, securing \$15M in infrastructure investment

#two-grid(
  left: [Helios Cloud Platform],
  right: [2017--2021],
)
_Director of Engineering_
- Built and managed a 45-person platform engineering division across three time zones, delivering the company's core developer experience tooling
- Spearheaded adoption of Kubernetes-based deployment infrastructure, cutting provisioning time by 80% and reducing cloud spend by \$3.2M annually
- Introduced structured incident response and blameless postmortem practices, decreasing mean time to recovery by 65%
- Served as executive sponsor for the company's diversity and inclusion engineering initiative

#two-grid(
  left: [Arcadia Software],
  right: [2013--2017],
)
_Senior Engineering Manager_
- Managed three cross-functional teams (18 engineers) delivering the flagship analytics product used by 500+ enterprise customers
- Led a full-stack rewrite from legacy Java/JSP to React and Node.js, achieving 40% improvement in page load performance
- Designed and implemented a CI/CD pipeline that reduced release cadence from monthly to daily, with zero-downtime deployments

= Strategic Competencies

- *Engineering Leadership* --- Organizational design, team scaling, executive communication, budget management, vendor strategy
- *Technical Strategy* --- Platform modernization, microservices architecture, cloud-native infrastructure, build-vs-buy evaluation
- *Operational Excellence* --- SRE practices, incident management, SLA/SLO frameworks, capacity planning, cost optimization
- *Talent & Culture* --- Career frameworks, performance management, D&I programs, mentorship, employer branding

= Education

#two-grid(
  left: [Columbia University, School of Engineering],
  right: [2007--2011],
)
- B.S. in Computer Science, _magna cum laude_
- Concentration in Distributed Systems
