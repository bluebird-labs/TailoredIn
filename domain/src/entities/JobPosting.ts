import { AggregateRoot } from '../AggregateRoot.js';
import { JobStatusChangedEvent } from '../events/JobStatusChangedEvent.js';
import { JobId } from '../value-objects/JobId.js';
import { DISCARDED_JOB_STATUSES, IN_PROCESS_JOB_STATUSES, JobStatus } from '../value-objects/JobStatus.js';
import type { SkillAffinity } from '../value-objects/SkillAffinity.js';
import type { Skill } from './Skill.js';

export type JobScoresSkillScore = {
  score: number;
  matches: Skill[];
};

export type JobScores = {
  salary: number | null;
  skills: Record<SkillAffinity, JobScoresSkillScore> & { total: JobScoresSkillScore };
};

export type JobPostingCreateProps = {
  companyId: string;
  status: JobStatus;
  applyLink: string | null;
  linkedinId: string;
  title: string;
  linkedinLink: string;
  type: string | null;
  level: string | null;
  remote: string | null;
  postedAt: Date | null;
  isRepost: boolean | null;
  locationRaw: string;
  salaryLow: number | null;
  salaryHigh: number | null;
  salaryRaw: string | null;
  description: string;
  descriptionHtml: string;
  applicantsCount: number | null;
};

export class JobPosting extends AggregateRoot<JobId> {
  public status: JobStatus;
  public applyLink: string | null;
  public readonly linkedinId: string;
  public readonly title: string;
  public readonly linkedinLink: string;
  public readonly type: string | null;
  public readonly level: string | null;
  public readonly remote: string | null;
  public readonly postedAt: Date | null;
  public readonly isRepost: boolean | null;
  public readonly locationRaw: string;
  public readonly salaryLow: number | null;
  public readonly salaryHigh: number | null;
  public readonly salaryRaw: string | null;
  public readonly description: string;
  public readonly descriptionHtml: string;
  public readonly applicantsCount: number | null;
  public readonly companyId: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public scores: Readonly<JobScores> | null = null;

  public constructor(props: {
    id: JobId;
    companyId: string;
    status: JobStatus;
    applyLink: string | null;
    linkedinId: string;
    title: string;
    linkedinLink: string;
    type: string | null;
    level: string | null;
    remote: string | null;
    postedAt: Date | null;
    isRepost: boolean | null;
    locationRaw: string;
    salaryLow: number | null;
    salaryHigh: number | null;
    salaryRaw: string | null;
    description: string;
    descriptionHtml: string;
    applicantsCount: number | null;
    createdAt: Date;
    updatedAt: Date;
    scores?: JobScores | null;
  }) {
    super(props.id);
    this.companyId = props.companyId;
    this.status = props.status;
    this.applyLink = props.applyLink;
    this.linkedinId = props.linkedinId;
    this.title = props.title;
    this.linkedinLink = props.linkedinLink;
    this.type = props.type;
    this.level = props.level;
    this.remote = props.remote;
    this.postedAt = props.postedAt;
    this.isRepost = props.isRepost;
    this.locationRaw = props.locationRaw;
    this.salaryLow = props.salaryLow;
    this.salaryHigh = props.salaryHigh;
    this.salaryRaw = props.salaryRaw;
    this.description = props.description;
    this.descriptionHtml = props.descriptionHtml;
    this.applicantsCount = props.applicantsCount;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.scores = props.scores ?? null;
  }

  // --- Queries ---

  public isNew(): boolean {
    return this.status === JobStatus.NEW;
  }

  public isInProcess(): boolean {
    return IN_PROCESS_JOB_STATUSES.has(this.status);
  }

  public isDiscarded(): boolean {
    return DISCARDED_JOB_STATUSES.has(this.status);
  }

  public isRemote(): boolean {
    return this.remote === 'remote';
  }

  public hasMoreApplicantsThan(count: number, ifNull = false): boolean {
    if (this.applicantsCount === null) return ifNull;
    return this.applicantsCount >= count;
  }

  public hasLessApplicantsThan(count: number, ifNull = true): boolean {
    if (this.applicantsCount === null) return ifNull;
    return this.applicantsCount <= count;
  }

  public isWithinSalaryRange(min: number, target: number, ifNull = true): boolean {
    if (this.salaryLow === null && this.salaryHigh === null) return ifNull;
    const low = this.salaryLow ?? this.salaryHigh!;
    const high = this.salaryHigh ?? this.salaryLow!;
    if (high < min) return false;
    return (low + high) / 2 >= target;
  }

  // --- Commands ---

  public changeStatus(newStatus: JobStatus): boolean {
    if (this.status === newStatus) return false;
    const oldStatus = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();
    this.addDomainEvent(new JobStatusChangedEvent(this.id.value, oldStatus, newStatus));
    return true;
  }

  public retire(): boolean {
    return this.changeStatus(JobStatus.RETIRED);
  }

  public setApplyLink(value: string): void {
    this.applyLink = value;
    this.updatedAt = new Date();
  }

  public setInitialStatus(status: JobStatus): void {
    this.status = status;
  }

  public score(scores: JobScores): void {
    this.scores = scores;
  }

  // --- Factory ---

  public static create(props: JobPostingCreateProps): JobPosting {
    const now = new Date();
    return new JobPosting({
      id: JobId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
