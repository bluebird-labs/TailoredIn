import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { AggregateRoot } from '../AggregateRoot.js';
import { JobLevel } from '../value-objects/JobLevel.js';
import type { JobSource } from '../value-objects/JobSource.js';
import { LocationType } from '../value-objects/LocationType.js';
import { SalaryRange } from '../value-objects/SalaryRange.js';

export type JobDescriptionCreateProps = {
  companyId: string;
  title: string;
  description: string;
  url?: string | null;
  location?: string | null;
  salaryRange?: SalaryRange | null;
  level?: JobLevel;
  locationType?: LocationType;
  source: JobSource;
  postedAt?: Date | null;
  rawText?: string | null;
  soughtHardSkills?: string[] | null;
  soughtSoftSkills?: string[] | null;
};

@Entity({ tableName: 'job_descriptions' })
export class JobDescription extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'company_id', type: 'uuid' })
  public readonly companyId: string;

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

  public get salaryRange(): SalaryRange | null {
    if (this.salaryCurrency === null) return null;
    return new SalaryRange({ min: this.salaryMin, max: this.salaryMax, currency: this.salaryCurrency });
  }

  public set salaryRange(value: SalaryRange | null) {
    this.salaryMin = value?.min ?? null;
    this.salaryMax = value?.max ?? null;
    this.salaryCurrency = value?.currency ?? null;
  }

  @Property({ fieldName: 'level', type: 'text' })
  public level: JobLevel;

  @Property({ fieldName: 'location_type', type: 'text' })
  public locationType: LocationType;

  @Property({ fieldName: 'source', type: 'text' })
  public source: JobSource;

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

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    companyId: string;
    title: string;
    description: string;
    url: string | null;
    location: string | null;
    salaryRange: SalaryRange | null;
    level: JobLevel;
    locationType: LocationType;
    source: JobSource;
    postedAt: Date | null;
    rawText: string | null;
    soughtHardSkills: string[] | null;
    soughtSoftSkills: string[] | null;
    resumePdf: Buffer | Uint8Array | null;
    resumePdfTheme: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this.id = props.id;
    this.companyId = props.companyId;
    this.title = props.title;
    this.description = props.description;
    this.url = props.url;
    this.location = props.location;
    this.salaryMin = props.salaryRange?.min ?? null;
    this.salaryMax = props.salaryRange?.max ?? null;
    this.salaryCurrency = props.salaryRange?.currency ?? null;
    this.level = props.level;
    this.locationType = props.locationType;
    this.source = props.source;
    this.postedAt = props.postedAt;
    this.rawText = props.rawText;
    this.soughtHardSkills = props.soughtHardSkills;
    this.soughtSoftSkills = props.soughtSoftSkills;
    this.resumePdf = props.resumePdf ? Buffer.from(props.resumePdf) : null;
    this.resumePdfTheme = props.resumePdfTheme;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: JobDescriptionCreateProps): JobDescription {
    const now = new Date();
    return new JobDescription({
      id: crypto.randomUUID(),
      companyId: props.companyId,
      title: props.title,
      description: props.description,
      url: props.url ?? null,
      location: props.location ?? null,
      salaryRange: props.salaryRange ?? null,
      level: props.level ?? JobLevel.UNKNOWN,
      locationType: props.locationType ?? LocationType.UNKNOWN,
      source: props.source,
      postedAt: props.postedAt ?? null,
      rawText: props.rawText ?? null,
      soughtHardSkills: props.soughtHardSkills ?? null,
      soughtSoftSkills: props.soughtSoftSkills ?? null,
      resumePdf: null,
      resumePdfTheme: null,
      createdAt: now,
      updatedAt: now
    });
  }
}
