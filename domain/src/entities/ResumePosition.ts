import { Entity } from '../Entity.js';
import { ResumePositionId } from '../value-objects/ResumePositionId.js';
import { ResumeBullet } from './ResumeBullet.js';

export type ResumePositionCreateProps = {
  resumeCompanyId: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

export class ResumePosition extends Entity<ResumePositionId> {
  public readonly resumeCompanyId: string;
  public title: string;
  public startDate: string;
  public endDate: string;
  public summary: string | null;
  public ordinal: number;
  public readonly bullets: ResumeBullet[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ResumePositionId;
    resumeCompanyId: string;
    title: string;
    startDate: string;
    endDate: string;
    summary: string | null;
    ordinal: number;
    bullets: ResumeBullet[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.resumeCompanyId = props.resumeCompanyId;
    this.title = props.title;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.summary = props.summary;
    this.ordinal = props.ordinal;
    this.bullets = props.bullets;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addBullet(props: { content: string; ordinal: number }): ResumeBullet {
    const bullet = ResumeBullet.create({ resumePositionId: this.id.value, ...props });
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

  public static create(props: ResumePositionCreateProps): ResumePosition {
    const now = new Date();
    return new ResumePosition({
      id: ResumePositionId.generate(),
      ...props,
      bullets: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
