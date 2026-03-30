import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumeCompany } from './ResumeCompany.js';

export type ResumeCompanyLocationProps = {
  id: string;
  resumeCompany: RefOrEntity<ResumeCompany>;
  locationLabel: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeCompanyLocationCreateProps = Omit<ResumeCompanyLocationProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'resume_company_locations' })
export class ResumeCompanyLocation extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => ResumeCompany, { lazy: true, name: 'resume_company_id' })
  public readonly resumeCompany: RefOrEntity<ResumeCompany>;

  @Property({ name: 'location_label', type: 'text' })
  public locationLabel: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: ResumeCompanyLocationProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.resumeCompany = props.resumeCompany;
    this.locationLabel = props.locationLabel;
    this.ordinal = props.ordinal;
  }

  public static create(props: ResumeCompanyLocationCreateProps): ResumeCompanyLocation {
    const now = new Date();
    return new ResumeCompanyLocation({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
