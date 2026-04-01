import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';

export type ArchetypeV2Props = {
  id: string;
  profileId: string;
  key: string;
  label: string;
  headlineId: string | null;
  contentSelection: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'archetypes_v2' })
export class ArchetypeV2 extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'profile_id', type: 'uuid' })
  public readonly profileId: string;

  @Property({ name: 'key', type: 'text' })
  public key: string;

  @Property({ name: 'label', type: 'text' })
  public label: string;

  @Property({ name: 'headline_id', type: 'uuid', nullable: true })
  public headlineId: string | null;

  @Property({ name: 'content_selection', type: 'json' })
  public contentSelection: Record<string, unknown>;

  public constructor(props: ArchetypeV2Props) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profileId = props.profileId;
    this.key = props.key;
    this.label = props.label;
    this.headlineId = props.headlineId;
    this.contentSelection = props.contentSelection;
  }
}
