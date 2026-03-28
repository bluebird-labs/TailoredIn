export enum Archetype {
  HAND_ON_MANAGER = 'hands_on_manager',
  LEADER_MANAGER = 'leader_manager',
  NERD = 'nerd',
  LEADER_IC = 'leader_ic'
}

export enum LanguageSkill {
  NODE = 'Node.js',
  TYPESCRIPT = 'Typescript',
  JAVASCRIPT = 'Javascript',
  RUBY = 'Ruby',
  JAVA = 'Java',
  PYTHON = 'Python',
  SWIFT = 'Swift',
  KOTLIN = 'Kotlin'
}

export enum DeploymentSkill {
  GIT = 'Git',
  TERRAFORM = 'Terraform',
  HELM = 'Helm Charts',
  DOCKER = 'Docker',
  KUBERNETES = 'Kubernetes',
  JENKINS = 'Jenkins',
  GITHUB_ACTIONS = 'Github Actions',
  ARGO_CD = 'ArgoCD',
  SPINNAKER = 'Spinnaker',
  HEROKU = 'Heroku',
  VERCEL = 'Vercel',
  RAILWAY = 'Railway'
}

export enum QueueSkill {
  KAFKA = 'Kafka',
  SQS = 'SQS',
  RABBIT_MQ = 'RabbitMQ',
  BULL_Q = 'BullQ',
}

export enum TelemetrySkill {
  JAEGER = 'Jaeger',
  ZIPKIN = 'Zipkin',
  GRAFANA = 'Grafana',
  KIBANA = 'Kibana',
  PROMETHEUS = 'Prometheus',
  SPLUNK = 'Splunk'
}

export enum StorageSkill {
  MYSQL = 'MySQL',
  POSTGRES = 'PostgreSQL',
  PRESTO = 'Presto',
  MONGODB = 'MongoDB',
  SQLITE = 'SQLite',
  REDIS = 'Redis',
  MEMCACHED = 'Memcached',
  ELASTICSEARCH = 'ElasticSearch',
  S3 = 'S3',
  GLACIER = 'S3 Glacier',
  SUPABASE = 'Supabase'
}

export enum AgileSkill {
  JIRA = 'Jira',
  SCRUM = 'Scrum',
  KANBAN = 'Kanban',
  PORTFOLIO = 'Jira Portfolio',
  PLAN = 'Jira Plan',
  GITHUB_PROJECTS = 'Github Projects',
  YOUTRACK = 'Jetbrains YouTrack'
}

export enum DocSkill {
  ADR = 'ADR',
  OPEN_API = 'OpenAPI',
  NOTION = 'Notion',
  MERMAID = 'Mermaid',
  PLANT_UML = 'PlantUML'
}

export enum ArchitectureSkill {
  EVENT_DRIVEN = 'EDA',
  MICROSERVICES = 'Microservices',
  SOA = 'SOA',
  ETL = 'ETL',
  REST = 'REST',
  GRAPH_QL = 'GraphQL',
  DDD = 'DDD',
}

export enum FrontendSkill {
  EMBER = 'Ember.js',
  ANGULAR = 'Angular.js',
  REACT = 'React',
  VUE = 'Vue.js',
  SASS = 'SASS',
  SCSS = 'SCSS',
  IOS = 'iOS',
  ANDROID = 'Android',
  ELECTRON = 'Electron',
  NW = 'NW.js'
}

export enum AwsSkill {
  EC2 = 'EC2',
  ECR = 'ECR',
  RDS = 'RDS',
  S3 = 'S3',
  SQS = 'SQS',
  SNS = 'SNS',
  EKS = 'EKS',
  GATEWAY = 'API Gateway',
  GLUE = 'Glue',
  CLOUDFRONT = 'CloudFront',
  BEANSTALK = 'Elastic Beanstalk',
  ROUTE53 = 'Route53',
  CLOUDWATCH = 'CloudWatch',
  XRAY = 'XRay',
  MSK = 'MSK',
  ELASTI_CACHE = 'ElastiCache',
  ATHENA = 'Athena',
  REDSHIFT = 'Redshift',
  AURORA = 'Aurora'
}

export enum JobTitle {
  SOFTWARE_ENGINEER = 'Software Engineer',
  SENIOR_ENGINEER = 'Senior Software Engineer',
  LEAD_ENGINEER = 'Lead Software Engineer',
  STAFF_ENGINEER = 'Staff Software Engineer',
  PRINCIPAL_ENGINEER = 'Principal Software Engineer',
  TECH_LEAD_MANAGER = 'Tech Lead Manager',
  CONSULTANT = 'Software Consultant',

  ENGINEERING_MANAGER = 'Engineering Manager',
  SENIOR_ENGINEERING_MANAGER = 'Senior Engineering Manager',
  DIRECTOR_OF_ENGINEERING = 'Director of Engineering',
  HEAD_OF_ENGINEERING = 'Head of Engineering',
  VICE_PRESIDENT_OF_ENGINEERING = 'Vice President of Engineering'
}

export type Stack = Record<string, string[]>;

export type Dates = {
  joined: string;
  left: string | 'present';
  promoted: string | null;
}

export type CompanyConfigInput<B extends string, L extends string> = {
  name: string;
  mention: string | null;
  website: string | null;
  domain: string;
  dates: Dates;
  locations: L[];
  bullets: B[];
}
