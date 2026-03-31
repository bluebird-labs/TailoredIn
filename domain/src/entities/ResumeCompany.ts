import { AggregateRoot } from '../AggregateRoot.js';
import { ResumeCompanyId } from '../value-objects/ResumeCompanyId.js';
import type { ResumeLocation } from '../value-objects/ResumeLocation.js';
import type { ResumePositionCreateProps } from './ResumePosition.js';
import { ResumePosition } from './ResumePosition.js';

export type ResumeCompanyCreateProps = {
  userId: string;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  locations: ResumeLocation[];
};

export class ResumeCompany extends AggregateRoot<ResumeCompanyId> {
  public readonly userId: string;
  public companyName: string;
  public companyMention: string | null;
  public websiteUrl: string | null;
  public businessDomain: string;
  public readonly locations: ResumeLocation[];
  public readonly positions: ResumePosition[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ResumeCompanyId;
    userId: string;
    companyName: string;
    companyMention: string | null;
    websiteUrl: string | null;
    businessDomain: string;
    locations: ResumeLocation[];
    positions: ResumePosition[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.userId = props.userId;
    this.companyName = props.companyName;
    this.companyMention = props.companyMention;
    this.websiteUrl = props.websiteUrl;
    this.businessDomain = props.businessDomain;
    this.locations = props.locations;
    this.positions = props.positions;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addPosition(props: Omit<ResumePositionCreateProps, 'resumeCompanyId'>): ResumePosition {
    const position = ResumePosition.create({ resumeCompanyId: this.id.value, ...props });
    this.positions.push(position);
    this.updatedAt = new Date();
    return position;
  }

  public removePosition(positionId: string): void {
    const index = this.positions.findIndex(p => p.id.value === positionId);
    if (index === -1) throw new Error(`Position not found: ${positionId}`);
    this.positions.splice(index, 1);
    this.updatedAt = new Date();
  }

  public findPositionOrFail(positionId: string): ResumePosition {
    const position = this.positions.find(p => p.id.value === positionId);
    if (!position) throw new Error(`Position not found: ${positionId}`);
    return position;
  }

  public replaceLocations(locations: ResumeLocation[]): void {
    this.locations.splice(0, this.locations.length, ...locations);
    this.updatedAt = new Date();
  }

  public static create(props: ResumeCompanyCreateProps): ResumeCompany {
    const now = new Date();
    return new ResumeCompany({
      id: ResumeCompanyId.generate(),
      ...props,
      positions: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
