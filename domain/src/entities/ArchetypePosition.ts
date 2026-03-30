import { Entity } from '../Entity.js';
import type { ArchetypePositionBulletRef } from '../value-objects/ArchetypePositionBulletRef.js';
import { ArchetypePositionId } from '../value-objects/ArchetypePositionId.js';

export type ArchetypePositionCreateProps = {
  archetypeId: string;
  resumeCompanyId: string;
  jobTitle: string;
  displayCompanyName: string;
  locationLabel: string;
  startDate: string;
  endDate: string;
  roleSummary: string;
  ordinal: number;
  bullets: ArchetypePositionBulletRef[];
};

export class ArchetypePosition extends Entity<ArchetypePositionId> {
  public readonly archetypeId: string;
  public readonly resumeCompanyId: string;
  public jobTitle: string;
  public displayCompanyName: string;
  public locationLabel: string;
  public startDate: string;
  public endDate: string;
  public roleSummary: string;
  public ordinal: number;
  public readonly bullets: ArchetypePositionBulletRef[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: {
    id: ArchetypePositionId;
    archetypeId: string;
    resumeCompanyId: string;
    jobTitle: string;
    displayCompanyName: string;
    locationLabel: string;
    startDate: string;
    endDate: string;
    roleSummary: string;
    ordinal: number;
    bullets: ArchetypePositionBulletRef[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.archetypeId = props.archetypeId;
    this.resumeCompanyId = props.resumeCompanyId;
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

  static create(props: ArchetypePositionCreateProps): ArchetypePosition {
    const now = new Date();
    return new ArchetypePosition({
      id: ArchetypePositionId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
