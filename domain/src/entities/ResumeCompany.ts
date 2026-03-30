import { AggregateRoot } from '../AggregateRoot.js';
import { ResumeCompanyId } from '../value-objects/ResumeCompanyId.js';
import type { ResumeLocation } from '../value-objects/ResumeLocation.js';
import { ResumeBullet } from './ResumeBullet.js';

export type ResumeCompanyCreateProps = {
  userId: string;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  joinedAt: string;
  leftAt: string;
  promotedAt: string | null;
  locations: ResumeLocation[];
  bullets: ResumeBullet[];
};

export class ResumeCompany extends AggregateRoot<ResumeCompanyId> {
  public readonly userId: string;
  public companyName: string;
  public companyMention: string | null;
  public websiteUrl: string | null;
  public businessDomain: string;
  public joinedAt: string;
  public leftAt: string;
  public promotedAt: string | null;
  public readonly locations: ResumeLocation[];
  public readonly bullets: ResumeBullet[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ResumeCompanyId;
    userId: string;
    companyName: string;
    companyMention: string | null;
    websiteUrl: string | null;
    businessDomain: string;
    joinedAt: string;
    leftAt: string;
    promotedAt: string | null;
    locations: ResumeLocation[];
    bullets: ResumeBullet[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.userId = props.userId;
    this.companyName = props.companyName;
    this.companyMention = props.companyMention;
    this.websiteUrl = props.websiteUrl;
    this.businessDomain = props.businessDomain;
    this.joinedAt = props.joinedAt;
    this.leftAt = props.leftAt;
    this.promotedAt = props.promotedAt;
    this.locations = props.locations;
    this.bullets = props.bullets;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addBullet(props: { content: string; ordinal: number }): ResumeBullet {
    const bullet = ResumeBullet.create({ resumeCompanyId: this.id.value, ...props });
    this.bullets.push(bullet);
    this.updatedAt = new Date();
    return bullet;
  }

  public updateBullet(bulletId: string, update: { content?: string; ordinal?: number }): void {
    const bullet = this.bullets.find(b => b.id.value === bulletId);
    if (!bullet) throw new Error(`Bullet not found: ${bulletId}`);
    if (update.content !== undefined) bullet.content = update.content;
    if (update.ordinal !== undefined) bullet.ordinal = update.ordinal;
    bullet.updatedAt = new Date();
    this.updatedAt = new Date();
  }

  public removeBullet(bulletId: string): void {
    const index = this.bullets.findIndex(b => b.id.value === bulletId);
    if (index === -1) throw new Error(`Bullet not found: ${bulletId}`);
    this.bullets.splice(index, 1);
    this.updatedAt = new Date();
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
      createdAt: now,
      updatedAt: now
    });
  }
}
