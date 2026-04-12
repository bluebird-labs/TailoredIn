import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { AggregateRoot } from '../AggregateRoot.js';
import { EntityNotFoundError } from '../EntityNotFoundError.js';
import { ValidationError } from '../ValidationError.js';
import { Accomplishment } from './Accomplishment.js';
import { ExperienceSkill } from './ExperienceSkill.js';

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
  bulletMin: number;
  bulletMax: number;
};

@Entity({ tableName: 'experiences' })
export class Experience extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'profile_id', type: 'uuid' })
  public readonly profileId: string;

  @Property({ fieldName: 'title', type: 'text' })
  public title: string;

  @Property({ fieldName: 'company_name', type: 'text' })
  public companyName: string;

  @Property({ fieldName: 'company_website', type: 'text', nullable: true })
  public companyWebsite: string | null;

  @Property({ fieldName: 'company_accent', type: 'text', nullable: true })
  public companyAccent: string | null;

  @Property({ fieldName: 'company_id', type: 'uuid', nullable: true })
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

  @Property({ fieldName: 'bullet_min', type: 'integer' })
  public bulletMin: number;

  @Property({ fieldName: 'bullet_max', type: 'integer' })
  public bulletMax: number;

  @OneToMany(
    () => Accomplishment,
    acc => acc.experienceId,
    { orphanRemoval: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly accomplishments = new Collection<Accomplishment>(this);

  @OneToMany(
    () => ExperienceSkill,
    es => es.experienceId,
    { orphanRemoval: true }
  )
  public readonly skills = new Collection<ExperienceSkill>(this);

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
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
    bulletMin: number;
    bulletMax: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    if (!props.title || props.title.length > 500)
      throw new ValidationError('title', 'must be between 1 and 500 characters');
    if (!props.companyName || props.companyName.length > 500)
      throw new ValidationError('companyName', 'must be between 1 and 500 characters');
    if (!props.location || props.location.length > 500)
      throw new ValidationError('location', 'must be between 1 and 500 characters');
    if (!props.startDate || props.startDate.length > 50)
      throw new ValidationError('startDate', 'must be between 1 and 50 characters');
    if (!props.endDate || props.endDate.length > 50)
      throw new ValidationError('endDate', 'must be between 1 and 50 characters');
    if (props.bulletMin < 0) throw new ValidationError('bulletMin', 'must be >= 0');
    if (props.bulletMax < props.bulletMin) throw new ValidationError('bulletMax', 'must be >= bulletMin');
    this.id = props.id;
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
    this.bulletMin = props.bulletMin;
    this.bulletMax = props.bulletMax;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addAccomplishment(props: { title: string; narrative: string; ordinal: number }): Accomplishment {
    const accomplishment = Accomplishment.create({ experienceId: this.id, ...props });
    this.accomplishments.add(accomplishment);
    this.updatedAt = new Date();
    return accomplishment;
  }

  public removeAccomplishment(accomplishmentId: string): void {
    const index = this.accomplishments.getItems().findIndex(a => a.id === accomplishmentId);
    if (index === -1) throw new EntityNotFoundError('Accomplishment', accomplishmentId);
    const item = this.accomplishments.getItems()[index];
    this.accomplishments.remove(item);
    this.updatedAt = new Date();
  }

  public findAccomplishmentOrFail(accomplishmentId: string): Accomplishment {
    const acc = this.accomplishments.getItems().find(a => a.id === accomplishmentId);
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

  public updateBulletRange(min: number, max: number): void {
    if (min < 0) throw new ValidationError('bulletMin', 'must be >= 0');
    if (max < min) throw new ValidationError('bulletMax', 'must be >= bulletMin');
    this.bulletMin = min;
    this.bulletMax = max;
    this.updatedAt = new Date();
  }

  public syncAccomplishments(items: { id: string | null; title: string; narrative: string; ordinal: number }[]): void {
    const inputIds = new Set(items.filter(i => i.id !== null).map(i => i.id as string));

    // Remove accomplishments absent from the input list
    const toRemove = this.accomplishments.getItems().filter(a => !inputIds.has(a.id));
    for (const item of toRemove) {
      this.accomplishments.remove(item);
    }

    // Add new (id === null) or update existing
    for (const item of items) {
      if (item.id === null) {
        this.accomplishments.add(
          Accomplishment.create({
            experienceId: this.id,
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

  public addSkill(skillId: string): ExperienceSkill {
    const skill = ExperienceSkill.create({ experienceId: this.id, skillId });
    this.skills.add(skill);
    this.updatedAt = new Date();
    return skill;
  }

  public removeSkill(skillId: string): void {
    const item = this.skills.getItems().find(s => s.skillId === skillId);
    if (!item) throw new EntityNotFoundError('ExperienceSkill', skillId);
    this.skills.remove(item);
    this.updatedAt = new Date();
  }

  public findSkillOrFail(skillId: string): ExperienceSkill {
    const item = this.skills.getItems().find(s => s.skillId === skillId);
    if (!item) throw new EntityNotFoundError('ExperienceSkill', skillId);
    return item;
  }

  public syncSkills(skillIds: string[]): void {
    const inputSet = new Set(skillIds);

    // Remove skills absent from the input list
    const toRemove = this.skills.getItems().filter(s => !inputSet.has(s.skillId));
    for (const item of toRemove) {
      this.skills.remove(item);
    }

    // Add new skills not already present
    const existingSkillIds = new Set(this.skills.getItems().map(s => s.skillId));
    for (const skillId of skillIds) {
      if (!existingSkillIds.has(skillId)) {
        this.skills.add(ExperienceSkill.create({ experienceId: this.id, skillId }));
      }
    }

    this.updatedAt = new Date();
  }

  public static create(props: ExperienceCreateProps): Experience {
    const now = new Date();
    return new Experience({
      id: crypto.randomUUID(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
