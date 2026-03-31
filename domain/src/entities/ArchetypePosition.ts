import { Entity } from '../Entity.js';
import type { ArchetypePositionBulletRef } from '../value-objects/ArchetypePositionBulletRef.js';
import { ArchetypePositionId } from '../value-objects/ArchetypePositionId.js';

export type ArchetypePositionCreateProps = {
  archetypeId: string;
  resumePositionId: string;
  jobTitle: string | null;
  displayCompanyName: string;
  locationLabel: string;
  startDate: string | null;
  endDate: string | null;
  roleSummary: string | null;
  ordinal: number;
  bullets: ArchetypePositionBulletRef[];
};

export class ArchetypePosition extends Entity<ArchetypePositionId> {
  public readonly archetypeId: string;
  public readonly resumePositionId: string;
  public jobTitle: string | null;
  public displayCompanyName: string;
  public locationLabel: string;
  public startDate: string | null;
  public endDate: string | null;
  public roleSummary: string | null;
  public ordinal: number;
  public readonly bullets: ArchetypePositionBulletRef[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ArchetypePositionId;
    archetypeId: string;
    resumePositionId: string;
    jobTitle: string | null;
    displayCompanyName: string;
    locationLabel: string;
    startDate: string | null;
    endDate: string | null;
    roleSummary: string | null;
    ordinal: number;
    bullets: ArchetypePositionBulletRef[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.archetypeId = props.archetypeId;
    this.resumePositionId = props.resumePositionId;
    this.jobTitle = props.jobTitle;
    this.displayCompanyName = props.displayCompanyName;
    this.locationLabel = props.locationLabel;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.roleSummary = props.roleSummary;
    this.ordinal = props.ordinal;
    this.bullets = props.bullets;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: ArchetypePositionCreateProps): ArchetypePosition {
    const now = new Date();
    return new ArchetypePosition({
      id: ArchetypePositionId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
