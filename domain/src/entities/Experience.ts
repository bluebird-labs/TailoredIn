import { AggregateRoot } from '../AggregateRoot.js';
import { EntityNotFoundError } from '../EntityNotFoundError.js';
import { ExperienceId } from '../value-objects/ExperienceId.js';
import { Accomplishment } from './Accomplishment.js';

export type ExperienceCreateProps = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyId: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

export class Experience extends AggregateRoot<ExperienceId> {
  public readonly profileId: string;
  public title: string;
  public companyName: string;
  public companyWebsite: string | null;
  public companyId: string | null;
  public location: string;
  public startDate: string;
  public endDate: string;
  public summary: string | null;
  public ordinal: number;
  public readonly accomplishments: Accomplishment[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ExperienceId;
    profileId: string;
    title: string;
    companyName: string;
    companyWebsite: string | null;
    companyId: string | null;
    location: string;
    startDate: string;
    endDate: string;
    summary: string | null;
    ordinal: number;
    accomplishments: Accomplishment[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.title = props.title;
    this.companyName = props.companyName;
    this.companyWebsite = props.companyWebsite;
    this.companyId = props.companyId;
    this.location = props.location;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.summary = props.summary;
    this.ordinal = props.ordinal;
    this.accomplishments = props.accomplishments;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addAccomplishment(props: { title: string; narrative: string; ordinal: number }): Accomplishment {
    const accomplishment = Accomplishment.create({ experienceId: this.id.value, ...props });
    this.accomplishments.push(accomplishment);
    this.updatedAt = new Date();
    return accomplishment;
  }

  public removeAccomplishment(accomplishmentId: string): void {
    const index = this.accomplishments.findIndex(a => a.id.value === accomplishmentId);
    if (index === -1) throw new EntityNotFoundError('Accomplishment', accomplishmentId);
    this.accomplishments.splice(index, 1);
    this.updatedAt = new Date();
  }

  public findAccomplishmentOrFail(accomplishmentId: string): Accomplishment {
    const acc = this.accomplishments.find(a => a.id.value === accomplishmentId);
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
    for (let i = this.accomplishments.length - 1; i >= 0; i--) {
      if (!inputIds.has(this.accomplishments[i].id.value)) {
        this.accomplishments.splice(i, 1);
      }
    }

    // Add new (id === null) or update existing
    for (const item of items) {
      if (item.id === null) {
        this.accomplishments.push(
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
      accomplishments: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
