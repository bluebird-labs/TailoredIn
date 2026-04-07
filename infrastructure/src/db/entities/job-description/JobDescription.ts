import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import type { Ref } from '@mikro-orm/postgresql';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Company } from '../companies/Company.js';

@Entity({ tableName: 'job_descriptions' })
export class JobDescription extends BaseEntity {
  @UuidPrimaryKey({ fieldName: 'id' })
  public id: string;

  @ManyToOne(() => Company, { lazy: true, fieldName: 'company_id' })
  public readonly company: Ref<Company> | Company;

  @Property({ fieldName: 'title', type: 'text' })
  public title: string;

  @Property({ fieldName: 'description', type: 'text' })
  public description: string;

  @Property({ fieldName: 'url', type: 'text', nullable: true })
  public url: string | null;

  @Property({ fieldName: 'location', type: 'text', nullable: true })
  public location: string | null;

  @Property({ fieldName: 'salary_min', type: 'integer', nullable: true })
  public salaryMin: number | null;

  @Property({ fieldName: 'salary_max', type: 'integer', nullable: true })
  public salaryMax: number | null;

  @Property({ fieldName: 'salary_currency', type: 'text', nullable: true })
  public salaryCurrency: string | null;

  @Property({ fieldName: 'level', type: 'text', nullable: true })
  public level: string | null;

  @Property({ fieldName: 'location_type', type: 'text', nullable: true })
  public locationType: string | null;

  @Property({ fieldName: 'source', type: 'text' })
  public source: string;

  @Property({ fieldName: 'posted_at', type: 'timestamp(3)', nullable: true })
  public postedAt: Date | null;

  @Property({ fieldName: 'raw_text', type: 'text', nullable: true })
  public rawText: string | null;

  @Property({ fieldName: 'sought_hard_skills', type: 'jsonb', nullable: true })
  public soughtHardSkills: string[] | null;

  @Property({ fieldName: 'sought_soft_skills', type: 'jsonb', nullable: true })
  public soughtSoftSkills: string[] | null;

  @Property({ fieldName: 'resume_pdf', type: 'blob', nullable: true })
  public resumePdf: Buffer | null;

  @Property({ fieldName: 'resume_pdf_theme', type: 'text', nullable: true })
  public resumePdfTheme: string | null;

  public constructor(props: {
    id: string;
    company: Ref<Company> | Company;
    title: string;
    description: string;
    url: string | null;
    location: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    level: string | null;
    locationType: string | null;
    source: string;
    postedAt: Date | null;
    rawText: string | null;
    soughtHardSkills: string[] | null;
    soughtSoftSkills: string[] | null;
    resumePdf: Buffer | null;
    resumePdfTheme: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.company = props.company;
    this.title = props.title;
    this.description = props.description;
    this.url = props.url;
    this.location = props.location;
    this.salaryMin = props.salaryMin;
    this.salaryMax = props.salaryMax;
    this.salaryCurrency = props.salaryCurrency;
    this.level = props.level;
    this.locationType = props.locationType;
    this.source = props.source;
    this.postedAt = props.postedAt;
    this.rawText = props.rawText;
    this.soughtHardSkills = props.soughtHardSkills;
    this.soughtSoftSkills = props.soughtSoftSkills;
    this.resumePdf = props.resumePdf;
    this.resumePdfTheme = props.resumePdfTheme;
  }
}
