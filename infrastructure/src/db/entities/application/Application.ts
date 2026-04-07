import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Company } from '../companies/Company.js';
import { JobDescription } from '../job-description/JobDescription.js';
import { Profile } from '../profile/Profile.js';

@Entity({ tableName: 'applications' })
export class Application extends BaseEntity {
  @UuidPrimaryKey({ fieldName: 'id' })
  public id: string;

  @ManyToOne(() => Profile, { fieldName: 'profile_id' })
  public readonly profile: Profile;

  @ManyToOne(() => Company, { fieldName: 'company_id' })
  public readonly company: Company;

  @ManyToOne(() => JobDescription, { fieldName: 'job_description_id', nullable: true })
  public jobDescription: JobDescription | null;

  @Property({ fieldName: 'status', type: 'text' })
  public status: string;

  @Property({ fieldName: 'notes', type: 'text', nullable: true })
  public notes: string | null;

  @Property({ fieldName: 'applied_at', type: 'timestamp(3)' })
  public appliedAt: Date;

  public constructor(props: {
    id: string;
    profile: Profile;
    company: Company;
    jobDescription: JobDescription | null;
    status: string;
    notes: string | null;
    appliedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profile = props.profile;
    this.company = props.company;
    this.jobDescription = props.jobDescription;
    this.status = props.status;
    this.notes = props.notes;
    this.appliedAt = props.appliedAt;
  }
}
