import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { AggregateRoot } from '../AggregateRoot.js';
import { ApplicationStatus } from '../value-objects/ApplicationStatus.js';

export type ApplicationCreateProps = {
  profileId: string;
  companyId: string;
  status?: ApplicationStatus;
  jobDescriptionId?: string | null;
  notes?: string | null;
  archiveReason?: string | null;
  withdrawReason?: string | null;
  resumeContentId?: string | null;
};

@Entity({ tableName: 'applications' })
export class Application extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'profile_id', type: 'uuid' })
  public readonly profileId: string;

  @Property({ fieldName: 'company_id', type: 'uuid' })
  public readonly companyId: string;

  @Property({ fieldName: 'status', type: 'text' })
  public status: ApplicationStatus;

  @Property({ fieldName: 'job_description_id', type: 'uuid', nullable: true })
  public jobDescriptionId: string | null;

  @Property({ fieldName: 'notes', type: 'text', nullable: true })
  public notes: string | null;

  @Property({ fieldName: 'resume_content_id', type: 'uuid', nullable: true })
  public resumeContentId: string | null;

  @Property({ fieldName: 'archive_reason', type: 'text', nullable: true })
  public archiveReason: string | null;

  @Property({ fieldName: 'withdraw_reason', type: 'text', nullable: true })
  public withdrawReason: string | null;

  @Property({ fieldName: 'applied_at', type: 'timestamp(3)' })
  public readonly appliedAt: Date;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    profileId: string;
    companyId: string;
    status: ApplicationStatus;
    jobDescriptionId: string | null;
    notes: string | null;
    resumeContentId: string | null;
    archiveReason: string | null;
    withdrawReason: string | null;
    appliedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this.id = props.id;
    this.profileId = props.profileId;
    this.companyId = props.companyId;
    this.status = props.status;
    this.jobDescriptionId = props.jobDescriptionId;
    this.notes = props.notes;
    this.resumeContentId = props.resumeContentId;
    this.archiveReason = props.archiveReason;
    this.withdrawReason = props.withdrawReason;
    this.appliedAt = props.appliedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public setStatus(status: ApplicationStatus): void {
    if (status === ApplicationStatus.ARCHIVED) {
      throw new Error('Use archive() to set ARCHIVED status');
    }
    if (status === ApplicationStatus.WITHDRAWN) {
      throw new Error('Use withdraw() to set WITHDRAWN status');
    }
    if (status === ApplicationStatus.APPLIED) {
      throw new Error('Use apply() to set APPLIED status');
    }
    this.status = status;
    this.archiveReason = null;
    this.withdrawReason = null;
    this.updatedAt = new Date();
  }

  public apply(resumeContentId: string): void {
    if (this.status !== ApplicationStatus.DRAFT) {
      throw new Error('Can only apply from DRAFT status');
    }
    this.status = ApplicationStatus.APPLIED;
    this.resumeContentId = resumeContentId;
    this.archiveReason = null;
    this.withdrawReason = null;
    this.updatedAt = new Date();
  }

  public archive(reason: string): void {
    this.status = ApplicationStatus.ARCHIVED;
    this.archiveReason = reason;
    this.withdrawReason = null;
    this.updatedAt = new Date();
  }

  public withdraw(reason: string): void {
    this.status = ApplicationStatus.WITHDRAWN;
    this.withdrawReason = reason;
    this.archiveReason = null;
    this.updatedAt = new Date();
  }

  public static create(props: ApplicationCreateProps): Application {
    const now = new Date();
    return new Application({
      id: crypto.randomUUID(),
      profileId: props.profileId,
      companyId: props.companyId,
      status: props.status ?? ApplicationStatus.DRAFT,
      jobDescriptionId: props.jobDescriptionId ?? null,
      notes: props.notes ?? null,
      resumeContentId: props.resumeContentId ?? null,
      archiveReason: props.archiveReason ?? null,
      withdrawReason: props.withdrawReason ?? null,
      appliedAt: now,
      createdAt: now,
      updatedAt: now
    });
  }
}
