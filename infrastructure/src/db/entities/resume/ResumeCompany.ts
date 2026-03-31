import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { User } from '../users/User.js';
import { ResumeCompanyLocation } from './ResumeCompanyLocation.js';
import { ResumePosition } from './ResumePosition.js';

export type ResumeCompanyProps = {
  id: string;
  user: RefOrEntity<User>;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeCompanyCreateProps = Omit<ResumeCompanyProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'resume_companies' })
export class ResumeCompany extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => User, { lazy: true, name: 'user_id' })
  public readonly user: RefOrEntity<User>;

  @Property({ name: 'company_name', type: 'text' })
  public companyName: string;

  @Property({ name: 'company_mention', type: 'text', nullable: true })
  public companyMention: string | null;

  @Property({ name: 'website_url', type: 'text', nullable: true })
  public websiteUrl: string | null;

  @Property({ name: 'business_domain', type: 'text' })
  public businessDomain: string;

  @OneToMany(
    () => ResumeCompanyLocation,
    loc => loc.resumeCompany,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly locations: Collection<ResumeCompanyLocation> = new Collection<ResumeCompanyLocation>(this);

  @OneToMany(
    () => ResumePosition,
    pos => pos.resumeCompany,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly positions: Collection<ResumePosition> = new Collection<ResumePosition>(this);

  public constructor(props: ResumeCompanyProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.user = props.user;
    this.companyName = props.companyName;
    this.companyMention = props.companyMention;
    this.websiteUrl = props.websiteUrl;
    this.businessDomain = props.businessDomain;
  }

  public static create(props: ResumeCompanyCreateProps): ResumeCompany {
    const now = new Date();
    return new ResumeCompany({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
