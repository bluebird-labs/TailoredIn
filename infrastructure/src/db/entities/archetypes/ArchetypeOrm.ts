import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';

export type ArchetypeOrmProps = {
  id: string;
  profileId: string;
  key: string;
  label: string;
  headlineId: string | null;
  headlineText: string;
  contentSelection: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'archetypes' })
export class ArchetypeOrm extends BaseEntity {
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

  @Property({ name: 'headline_text', type: 'text', default: '' })
  public headlineText: string;

  @Property({ name: 'content_selection', type: 'json' })
  public contentSelection: Record<string, unknown>;

  public constructor(props: ArchetypeOrmProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profileId = props.profileId;
    this.key = props.key;
    this.label = props.label;
    this.headlineId = props.headlineId;
    this.headlineText = props.headlineText;
    this.contentSelection = props.contentSelection;
  }
}
