import { AggregateRoot } from '../AggregateRoot.js';
import { JobDescriptionId } from '../value-objects/JobDescriptionId.js';
import type { JobLevel } from '../value-objects/JobLevel.js';
import type { JobSource } from '../value-objects/JobSource.js';
import type { LocationType } from '../value-objects/LocationType.js';
import type { SalaryRange } from '../value-objects/SalaryRange.js';

export type JobDescriptionCreateProps = {
  companyId: string;
  title: string;
  description: string;
  url?: string | null;
  location?: string | null;
  salaryRange?: SalaryRange | null;
  level?: JobLevel | null;
  locationType?: LocationType | null;
  source: JobSource;
  postedAt?: Date | null;
  rawText?: string | null;
  soughtHardSkills?: string[] | null;
  soughtSoftSkills?: string[] | null;
};

export class JobDescription extends AggregateRoot<JobDescriptionId> {
  public readonly companyId: string;
  public title: string;
  public description: string;
  public url: string | null;
  public location: string | null;
  public salaryRange: SalaryRange | null;
  public level: JobLevel | null;
  public locationType: LocationType | null;
  public source: JobSource;
  public postedAt: Date | null;
  public rawText: string | null;
  public soughtHardSkills: string[] | null;
  public soughtSoftSkills: string[] | null;
  public resumePdf: Uint8Array | null;
  public resumePdfTheme: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: JobDescriptionId;
    companyId: string;
    title: string;
    description: string;
    url: string | null;
    location: string | null;
    salaryRange: SalaryRange | null;
    level: JobLevel | null;
    locationType: LocationType | null;
    source: JobSource;
    postedAt: Date | null;
    rawText: string | null;
    soughtHardSkills: string[] | null;
    soughtSoftSkills: string[] | null;
    resumePdf: Uint8Array | null;
    resumePdfTheme: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.companyId = props.companyId;
    this.title = props.title;
    this.description = props.description;
    this.url = props.url;
    this.location = props.location;
    this.salaryRange = props.salaryRange;
    this.level = props.level;
    this.locationType = props.locationType;
    this.source = props.source;
    this.postedAt = props.postedAt;
    this.rawText = props.rawText;
    this.soughtHardSkills = props.soughtHardSkills;
    this.soughtSoftSkills = props.soughtSoftSkills;
    this.resumePdf = props.resumePdf;
    this.resumePdfTheme = props.resumePdfTheme;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: JobDescriptionCreateProps): JobDescription {
    const now = new Date();
    return new JobDescription({
      id: JobDescriptionId.generate(),
      companyId: props.companyId,
      title: props.title,
      description: props.description,
      url: props.url ?? null,
      location: props.location ?? null,
      salaryRange: props.salaryRange ?? null,
      level: props.level ?? null,
      locationType: props.locationType ?? null,
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
