import { Collection, type Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Company } from '../companies/Company.js';
import { Profile } from '../profile/Profile.js';
import { Accomplishment } from './Accomplishment.js';

type ExperienceProps = {
  id: string;
  profile: Ref<Profile> | Profile;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyAccent: string | null;
  company: Ref<Company> | Company | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'experiences' })
export class Experience extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Profile, { lazy: true, name: 'profile_id' })
  public readonly profile: Ref<Profile> | Profile;

  @Property({ name: 'title', type: 'text' })
  public title: string;

  @Property({ name: 'company_name', type: 'text' })
  public companyName: string;

  @Property({ name: 'company_website', type: 'text', nullable: true })
  public companyWebsite: string | null;

  @Property({ name: 'company_accent', type: 'text', nullable: true })
  public companyAccent: string | null;

  @ManyToOne(() => Company, { lazy: true, name: 'company_id', nullable: true })
  public company: Ref<Company> | Company | null;

  @Property({ name: 'location', type: 'text' })
  public location: string;

  @Property({ name: 'start_date', type: 'text' })
  public startDate: string;

  @Property({ name: 'end_date', type: 'text' })
  public endDate: string;

  @Property({ name: 'summary', type: 'text', nullable: true })
  public summary: string | null;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => Accomplishment,
    acc => acc.experience,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly accomplishments: Collection<Accomplishment> = new Collection<Accomplishment>(this);

  public constructor(props: ExperienceProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profile = props.profile;
    this.title = props.title;
    this.companyName = props.companyName;
    this.companyWebsite = props.companyWebsite;
    this.companyAccent = props.companyAccent;
    this.company = props.company;
    this.location = props.location;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.summary = props.summary;
    this.ordinal = props.ordinal;
  }
}
