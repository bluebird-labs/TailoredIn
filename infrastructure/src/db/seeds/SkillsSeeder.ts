import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import * as NpmLog from 'npmlog';
import { Skill } from '../entities/skills/Skill.js';
import { SkillAffinity } from '../entities/skills/SkillAffinity.js';
import type { SkillOrmRepository } from '../entities/skills/SkillOrmRepository.js';

const skills = new Map<string, { affinity: SkillAffinity; variants: string[] }>([
  // Languages.
  ['Node.js', { affinity: SkillAffinity.EXPERT, variants: ['Node', 'NodeJs', 'NodeJS'] }],
  ['TypeScript', { affinity: SkillAffinity.EXPERT, variants: ['TS', 'Typescript'] }],
  ['Javascript', { affinity: SkillAffinity.EXPERT, variants: ['JS', 'js', 'JavaScript'] }],
  ['C#', { affinity: SkillAffinity.INTEREST, variants: ['CSharp'] }],
  ['Ruby', { affinity: SkillAffinity.AVOID, variants: ['RoR'] }],
  ['Java', { affinity: SkillAffinity.INTEREST, variants: ['JAVA'] }],
  ['Python', { affinity: SkillAffinity.AVOID, variants: [] }],
  ['Swift', { affinity: SkillAffinity.AVOID, variants: [] }],
  ['Kotlin', { affinity: SkillAffinity.INTEREST, variants: [] }],
  ['Go', { affinity: SkillAffinity.INTEREST, variants: ['GoLang', 'Golang'] }],
  ['Rust', { affinity: SkillAffinity.INTEREST, variants: [] }],
  ['PHP', { affinity: SkillAffinity.AVOID, variants: [] }],

  // DevOps.
  ['AWS', { affinity: SkillAffinity.EXPERT, variants: ['Amazon Web Services'] }],
  ['Git', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Terraform', { affinity: SkillAffinity.EXPERT, variants: ['IaC', 'Infrastructure as Code'] }],
  ['Helm Charts', { affinity: SkillAffinity.EXPERT, variants: ['Helm'] }],
  ['Docker', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Kubernetes', { affinity: SkillAffinity.EXPERT, variants: ['K8', 'K8s'] }],
  ['Jenkins', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Github Actions', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['ArgoCD', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['CircleCI', { affinity: SkillAffinity.EXPERT, variants: ['Circle CI'] }],
  ['Spinnaker', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Heroku', { affinity: SkillAffinity.AVOID, variants: [] }],
  ['Vercel', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Railway', { affinity: SkillAffinity.EXPERT, variants: [] }],

  // Queues.
  ['Kafka', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['RabbitMQ', { affinity: SkillAffinity.INTEREST, variants: [] }],
  ['BullQ', { affinity: SkillAffinity.EXPERT, variants: [] }],

  // Telemetry.
  ['Jaeger', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Zipkin', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Grafana', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Kibana', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Prometheus', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Splunk', { affinity: SkillAffinity.EXPERT, variants: [] }],

  // Storage.
  ['MySQL', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['PostgreSQL', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Presto', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['MongoDB', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['SQLite', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Redis', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Memcached', { affinity: SkillAffinity.EXPERT, variants: ['Memcache'] }],
  ['ElasticSearch', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Supabase', { affinity: SkillAffinity.EXPERT, variants: [] }],

  // Agile.
  ['Jira', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Scrum', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Kanban', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Jira Portfolio', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Jira Plan', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Github Projects', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Jetbrains YouTrack', { affinity: SkillAffinity.EXPERT, variants: [] }],

  // Docs.
  ['ADR', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['OpenAPI', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Notion', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Mermaid', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['PlantUML', { affinity: SkillAffinity.EXPERT, variants: [] }],

  // Architecture.
  ['EDA', { affinity: SkillAffinity.EXPERT, variants: ['Event-Driven Architecture'] }],
  ['Microservices', { affinity: SkillAffinity.EXPERT, variants: ['microservices'] }],
  ['SOA', { affinity: SkillAffinity.EXPERT, variants: ['Service Oriented Architecture'] }],
  ['ETL', { affinity: SkillAffinity.EXPERT, variants: ['Extract Transform Load'] }],
  ['REST', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['GraphQL', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['DDD', { affinity: SkillAffinity.EXPERT, variants: ['Domain Driven Design'] }],

  // Frontend.
  ['Ember.js', { affinity: SkillAffinity.AVOID, variants: ['Ember'] }],
  ['Angular.js', { affinity: SkillAffinity.AVOID, variants: ['Angular'] }],
  ['React', { affinity: SkillAffinity.AVOID, variants: ['React.js'] }],
  ['Vue.js', { affinity: SkillAffinity.AVOID, variants: ['Vue'] }],
  ['SASS', { affinity: SkillAffinity.AVOID, variants: [] }],
  ['SCSS', { affinity: SkillAffinity.AVOID, variants: [] }],
  ['Electron', { affinity: SkillAffinity.EXPERT, variants: [] }],

  // AWS.
  ['EC2', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['ECR', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['RDS', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['S3', { affinity: SkillAffinity.EXPERT, variants: ['Glacier'] }],
  ['SQS', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['SNS', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['EKS', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['API Gateway', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Glue', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['CloudFront', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Elastic Beanstalk', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Route53', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['CloudWatch', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['XRay', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['MSK', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['ElastiCache', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Athena', { affinity: SkillAffinity.EXPERT, variants: ['Presto'] }],
  ['Redshift', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Aurora', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['Lambda', { affinity: SkillAffinity.EXPERT, variants: [] }],

  // General.
  ['OOP', { affinity: SkillAffinity.EXPERT, variants: ['Object-oriented', 'Object-Oriented'] }],
  ['Design Patterns', { affinity: SkillAffinity.EXPERT, variants: [] }],
  ['CI/CD', { affinity: SkillAffinity.EXPERT, variants: ['continuous integration'] }],
  ['LLM', { affinity: SkillAffinity.INTEREST, variants: ['AI', 'Prompt Engineering'] }],
  ['Backend', { affinity: SkillAffinity.EXPERT, variants: ['Backend'] }],
  ['Devops', { affinity: SkillAffinity.INTEREST, variants: ['DevOps'] }]
]);

export class SkillsSeeder extends Seeder {
  public async run(em: EntityManager): Promise<void> {
    const newSkills: Skill[] = [];

    for (const [name, { affinity, variants }] of skills.entries()) {
      newSkills.push(Skill.create({ name, affinity, variants }));
    }

    const repo = em.getRepository(Skill) as SkillOrmRepository;
    const stats = await repo.refreshAll(newSkills);

    NpmLog.info(this.constructor.name, `All skills refreshed.`, stats);
  }
}
