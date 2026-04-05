import { AggregateRoot } from '../AggregateRoot.js';
import { ApplicationId } from '../value-objects/ApplicationId.js';
import { ApplicationStatus } from '../value-objects/ApplicationStatus.js';

export type ApplicationCreateProps = {
  profileId: string;
  companyId: string;
  status?: ApplicationStatus;
  jobDescriptionId?: string | null;
  notes?: string | null;
};

export class Application extends AggregateRoot<ApplicationId> {
  public readonly profileId: string;
  public readonly companyId: string;
  public status: ApplicationStatus;
  public jobDescriptionId: string | null;
  public notes: string | null;
  public readonly appliedAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ApplicationId;
    profileId: string;
    companyId: string;
    status: ApplicationStatus;
    jobDescriptionId: string | null;
    notes: string | null;
    appliedAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.companyId = props.companyId;
    this.status = props.status;
    this.jobDescriptionId = props.jobDescriptionId;
    this.notes = props.notes;
    this.appliedAt = props.appliedAt;
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
      updatedAt: now
    });
  }
}
