import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { AggregateRoot } from '../AggregateRoot.js';
import { EntityNotFoundError } from '../EntityNotFoundError.js';
import { ExperienceIdType } from '../orm-types/ExperienceIdType.js';
import { ExperienceId } from '../value-objects/ExperienceId.js';
import { Accomplishment } from './Accomplishment.js';
import { Company } from './Company.js';
import { Profile } from './Profile.js';

export type ExperienceCreateProps = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyAccent: string | null;
  companyId: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

@Entity({ tableName: 'experiences' })
export class Experience extends AggregateRoot<ExperienceId> {
  @PrimaryKey({ type: ExperienceIdType, fieldName: 'id' })
  public declare readonly id: ExperienceId;

  @ManyToOne(() => Profile, { fieldName: 'profile_id', mapToPk: true })
  public readonly profileId: string;

  @Property({ fieldName: 'title', type: 'text' })
  public title: string;

  @Property({ fieldName: 'company_name', type: 'text' })
  public companyName: string;

  @Property({ fieldName: 'company_website', type: 'text', nullable: true })
  public companyWebsite: string | null;

  @Property({ fieldName: 'company_accent', type: 'text', nullable: true })
  public companyAccent: string | null;

  @ManyToOne(() => Company, { fieldName: 'company_id', mapToPk: true, nullable: true })
  public companyId: string | null;

  @Property({ fieldName: 'location', type: 'text' })
  public location: string;

  @Property({ fieldName: 'start_date', type: 'text' })
  public startDate: string;

  @Property({ fieldName: 'end_date', type: 'text' })
  public endDate: string;

  @Property({ fieldName: 'summary', type: 'text', nullable: true })
  public summary: string | null;

  @Property({ fieldName: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => Accomplishment,
    acc => acc.experienceId,
    { orphanRemoval: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly accomplishments = new Collection<Accomplishment>(this);

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: ExperienceId;
    profileId: string;
    title: string;
    companyName: string;
    companyWebsite: string | null;
    companyAccent: string | null;
    companyId: string | null;
    location: string;
    startDate: string;
    endDate: string;
    summary: string | null;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.title = props.title;
    this.companyName = props.companyName;
    this.companyWebsite = props.companyWebsite;
    this.companyAccent = props.companyAccent;
    this.companyId = props.companyId;
    this.location = props.location;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.summary = props.summary;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addAccomplishment(props: { title: string; narrative: string; ordinal: number }): Accomplishment {
    const accomplishment = Accomplishment.create({ experienceId: this.id.value, ...props });
    this.accomplishments.add(accomplishment);
    this.updatedAt = new Date();
    return accomplishment;
  }

  public removeAccomplishment(accomplishmentId: string): void {
    const index = this.accomplishments.getItems().findIndex(a => a.id.value === accomplishmentId);
    if (index === -1) throw new EntityNotFoundError('Accomplishment', accomplishmentId);
    const item = this.accomplishments.getItems()[index];
    this.accomplishments.remove(item);
    this.updatedAt = new Date();
  }

  public findAccomplishmentOrFail(accomplishmentId: string): Accomplishment {
    const acc = this.accomplishments.getItems().find(a => a.id.value === accomplishmentId);
    if (!acc) throw new EntityNotFoundError('Accomplishment', accomplishmentId);
    return acc;
  }

  public linkCompany(companyId: string): void {
    this.companyId = companyId;
    this.updatedAt = new Date();
  }

  public unlinkCompany(): void {
    this.companyId = null;
    this.updatedAt = new Date();
  }

  public syncAccomplishments(items: { id: string | null; title: string; narrative: string; ordinal: number }[]): void {
    const inputIds = new Set(items.filter(i => i.id !== null).map(i => i.id as string));

    // Remove accomplishments absent from the input list
    const toRemove = this.accomplishments.getItems().filter(a => !inputIds.has(a.id.value));
    for (const item of toRemove) {
      this.accomplishments.remove(item);
    }

    // Add new (id === null) or update existing
    for (const item of items) {
      if (item.id === null) {
        this.accomplishments.add(
          Accomplishment.create({
            experienceId: this.id.value,
            title: item.title,
            narrative: item.narrative,
            ordinal: item.ordinal
          })
        );
      } else {
        this.findAccomplishmentOrFail(item.id).update({
          title: item.title,
          narrative: item.narrative,
          ordinal: item.ordinal
        });
      }
    }

    this.updatedAt = new Date();
  }

  public static create(props: ExperienceCreateProps): Experience {
    const now = new Date();
    return new Experience({
      id: ExperienceId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
