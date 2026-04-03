import { AggregateRoot } from '../AggregateRoot.js';
import { ExperienceId } from '../value-objects/ExperienceId.js';
import { Accomplishment } from './Accomplishment.js';

export type ExperienceCreateProps = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  narrative?: string | null;
  ordinal: number;
};

export class Experience extends AggregateRoot<ExperienceId> {
  public readonly profileId: string;
  public title: string;
  public companyName: string;
  public companyWebsite: string | null;
  public location: string;
  public startDate: string;
  public endDate: string;
  public summary: string | null;
  public narrative: string | null;
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
    location: string;
    startDate: string;
    endDate: string;
    summary: string | null;
    narrative: string | null;
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
    this.location = props.location;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.summary = props.summary;
    this.narrative = props.narrative;
    this.ordinal = props.ordinal;
    this.accomplishments = props.accomplishments;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addAccomplishment(props: {
    title: string;
    narrative: string;
    skillTags: string[];
    ordinal: number;
  }): Accomplishment {
    const accomplishment = Accomplishment.create({ experienceId: this.id.value, ...props });
    this.accomplishments.push(accomplishment);
    this.updatedAt = new Date();
    return accomplishment;
  }

  public removeAccomplishment(accomplishmentId: string): void {
    const index = this.accomplishments.findIndex(a => a.id.value === accomplishmentId);
    if (index === -1) throw new Error(`Accomplishment not found: ${accomplishmentId}`);
    this.accomplishments.splice(index, 1);
    this.updatedAt = new Date();
  }

  public findAccomplishmentOrFail(accomplishmentId: string): Accomplishment {
    const acc = this.accomplishments.find(a => a.id.value === accomplishmentId);
    if (!acc) throw new Error(`Accomplishment not found: ${accomplishmentId}`);
    return acc;
  }

  public static create(props: ExperienceCreateProps): Experience {
    const now = new Date();
    return new Experience({
      id: ExperienceId.generate(),
      ...props,
      narrative: props.narrative ?? null,
      accomplishments: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
