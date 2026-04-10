#import "@preview/typographic-resume:0.1.0": *

#show: resume.with(
  first-name: "Sylvain",
  last-name: "Estevez",
  profession: "Vice President of Engineering",
  bio: [
    Engineering executive with 15+ years of experience building and scaling high-performance organizations across fintech, SaaS, and developer platforms. Combines deep technical fluency in distributed systems and cloud-native architecture with a strategic focus on organizational design, talent development, and operational excellence. Proven track record of growing engineering teams from startup scale to 150+ engineers while maintaining velocity and culture.
  ],
  aside: [
    #section("Contact")[
      #contact-entry[Location][New York, NY]
      #contact-entry[Email][#link("mailto:sylvain@estevez.dev")[sylvain\@estevez.dev]]
      #contact-entry[LinkedIn][#link("https://linkedin.com/in/sylvainestevez")[linkedin.com/in/sylvainestevez]]
    ]

    #section("Strategic Competencies")[
      - Engineering Organization Design
      - Technical Strategy & Roadmapping
      - M&A Technical Due Diligence
      - Platform Modernization
      - Executive Stakeholder Management
      - Talent Acquisition & Retention
      - Agile Transformation at Scale
      - Vendor & Partnership Strategy
      - Incident Management & SRE Culture
      - OKR & Metrics-Driven Leadership
    ]

    #section("Languages")[
      #language-entry[English][Native]
      #language-entry[French][Native]
      #language-entry[Spanish][Professional]
    ]

    #section("Education")[
      #education-entry(
        timeframe: "2006--2010",
        title: "M.S. Computer Science",
        institution: "Columbia University",
        location: "New York, NY",
      )[]
      #education-entry(
        timeframe: "2002--2006",
        title: "B.S. Mathematics",
        institution: "Universit\u{00E9} Paris-Saclay",
        location: "Paris, France",
      )[]
    ]
  ],
)

#section("Experience")[

  #work-entry(
    timeframe: "2021--Present",
    title: "Vice President of Engineering",
    organization: "Meridian Financial Technologies",
    location: "New York, NY",
  )[
    Lead a 150-person engineering organization across six product verticals serving 4M+ active users. Drove a multi-year platform decomposition from monolith to event-driven microservices, reducing deployment cycle time by 70% and incident volume by 45%. Established the company's first Architecture Review Board and Technical Fellows program to scale decision-making and retain senior talent. Partnered with CPO and CFO to build the three-year technology investment roadmap, securing \$12M in incremental engineering budget tied to measurable business outcomes. Oversaw two successful acquisitions, leading technical due diligence and post-merger integration of 40 engineers.
  ]

  #work-entry(
    timeframe: "2017--2021",
    title: "Senior Director of Engineering",
    organization: "Helios Cloud Platform",
    location: "San Francisco, CA",
  )[
    Grew the platform engineering division from 25 to 85 engineers across four teams: infrastructure, developer experience, data platform, and security. Spearheaded the migration from on-premises data centers to a multi-cloud Kubernetes architecture, achieving 99.99% uptime and reducing infrastructure costs by 35%. Introduced engineering-wide OKRs aligned to company strategy, improving cross-team delivery predictability from 60% to 88%. Built a structured hiring pipeline that reduced time-to-fill from 65 to 28 days while increasing offer acceptance rates to 92%.
  ]

  #work-entry(
    timeframe: "2013--2017",
    title: "Senior Engineering Manager",
    organization: "Canopy Developer Tools",
    location: "New York, NY",
  )[
    Managed three teams (18 engineers) building a real-time collaboration SDK used by 2,000+ enterprise customers. Championed the adoption of continuous delivery practices, moving from monthly releases to 15+ deployments per day with zero-downtime deploys. Designed the on-call rotation and incident response framework that became the template for the broader engineering organization. Mentored four engineers into management roles and established the company's first internal engineering conference to foster knowledge sharing.
  ]

]
