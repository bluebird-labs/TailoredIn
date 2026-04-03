import { Entity } from '../Entity.js';
import { AccomplishmentId } from '../value-objects/AccomplishmentId.js';

export type AccomplishmentCreateProps = {
  experienceId: string;
  title: string;
  narrative: string;
  skillTags: string[];
  ordinal: number;
};

export class Accomplishment extends Entity<AccomplishmentId> {
  public readonly experienceId: string;
  public title: string;
  public narrative: string;
  public skillTags: string[];
  public ordinal: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: AccomplishmentId;
    experienceId: string;
    title: string;
    narrative: string;
    skillTags: string[];
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.experienceId = props.experienceId;
    this.title = props.title;
    this.narrative = props.narrative;
    this.skillTags = props.skillTags;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public update(props: Partial<{ title: string; narrative: string; skillTags: string[]; ordinal: number }>): void {
    if (props.title !== undefined) this.title = props.title;
    if (props.narrative !== undefined) this.narrative = props.narrative;
    if (props.skillTags !== undefined) this.skillTags = props.skillTags;
    if (props.ordinal !== undefined) this.ordinal = props.ordinal;
    this.updatedAt = new Date();
  }

  public static create(props: AccomplishmentCreateProps): Accomplishment {
    const now = new Date();
    return new Accomplishment({
      id: AccomplishmentId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }
}
