import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { AggregateRoot } from '../AggregateRoot.js';
import { ApplicationIdType } from '../orm-types/ApplicationIdType.js';
import { ApplicationId } from '../value-objects/ApplicationId.js';
import { ApplicationStatus } from '../value-objects/ApplicationStatus.js';
import { Company } from './Company.js';
import { JobDescription } from './JobDescription.js';
import { Profile } from './Profile.js';

export type ApplicationCreateProps = {
  profileId: string;
  companyId: string;
  status?: ApplicationStatus;
  jobDescriptionId?: string | null;
  notes?: string | null;
};

@Entity({ tableName: 'applications' })
export class Application extends AggregateRoot<ApplicationId> {
  @PrimaryKey({ type: ApplicationIdType, fieldName: 'id' })
  public declare readonly id: ApplicationId;

  @ManyToOne(() => Profile, { fieldName: 'profile_id', mapToPk: true })
  public readonly profileId: string;

  @ManyToOne(() => Company, { fieldName: 'company_id', mapToPk: true })
  public readonly companyId: string;

  @Property({ fieldName: 'status', type: 'text' })
  public status: ApplicationStatus;

  @ManyToOne(() => JobDescription, { fieldName: 'job_description_id', mapToPk: true, nullable: true })
  public jobDescriptionId: string | null;

  @Property({ fieldName: 'notes', type: 'text', nullable: true })
  public notes: string | null;

  @Property({ fieldName: 'applied_at', type: 'timestamp(3)' })
  public readonly appliedAt: Date;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: ApplicationId;
    profileId: string;
    companyId: string;
    status: ApplicationStatus;
    jobDescriptionId: string | null;
    notes: string | null;
    appliedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.companyId = props.companyId;
    this.status = props.status;
    this.jobDescriptionId = props.jobDescriptionId;
    this.notes = props.notes;
    this.appliedAt = props.appliedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public setStatus(status: ApplicationStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  public static create(props: ApplicationCreateProps): Application {
    const now = new Date();
    return new Application({
      id: ApplicationId.generate(),
      profileId: props.profileId,
      companyId: props.companyId,
      status: props.status ?? ApplicationStatus.DRAFT,
      jobDescriptionId: props.jobDescriptionId ?? null,
      notes: props.notes ?? null,
      appliedAt: now,
      createdAt: now,
      updatedAt: now
    });
  }
}
