import { AggregateRoot } from '../AggregateRoot.js';
import { ExperienceId } from '../value-objects/ExperienceId.js';
import { Bullet } from './Bullet.js';

export type ExperienceCreateProps = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
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
  public location: string;
  public startDate: string;
  public endDate: string;
  public summary: string | null;
  public ordinal: number;
  public readonly bullets: Bullet[];
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
    ordinal: number;
    bullets: Bullet[];
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
    this.ordinal = props.ordinal;
    this.bullets = props.bullets;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addBullet(props: { content: string; ordinal: number }): Bullet {
    const bullet = Bullet.create({ experienceId: this.id.value, ...props });
    this.bullets.push(bullet);
    this.updatedAt = new Date();
    return bullet;
  }

  public removeBullet(bulletId: string): void {
    const index = this.bullets.findIndex(b => b.id.value === bulletId);
    if (index === -1) throw new Error(`Bullet not found: ${bulletId}`);
    this.bullets.splice(index, 1);
    this.updatedAt = new Date();
  }

  public findBulletOrFail(bulletId: string): Bullet {
    const bullet = this.bullets.find(b => b.id.value === bulletId);
    if (!bullet) throw new Error(`Bullet not found: ${bulletId}`);
    return bullet;
  }

  public static create(props: ExperienceCreateProps): Experience {
    const now = new Date();
    return new Experience({
      id: ExperienceId.generate(),
      ...props,
      bullets: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
