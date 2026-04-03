import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity as MikroOrmBaseEntity } from '@mikro-orm/postgresql';
import { UuidPrimaryKey } from '../../helpers.js';

export type ResumeProfileOrmProps = {
  profileId: string;
  contentSelection: Record<string, unknown>;
  headlineText: string;
  updatedAt: Date;
};

@Entity({ tableName: 'resume_profiles' })
export class ResumeProfileOrm extends MikroOrmBaseEntity {
  @UuidPrimaryKey({ name: 'profile_id' })
  public readonly profileId: string;

  @Property({ name: 'content_selection', type: 'json' })
  public contentSelection: Record<string, unknown>;

  @Property({ name: 'headline_text', type: 'text', default: '' })
  public headlineText: string;

  @Property({ name: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: ResumeProfileOrmProps) {
    super();
    this.profileId = props.profileId;
    this.contentSelection = props.contentSelection;
    this.headlineText = props.headlineText;
    this.updatedAt = props.updatedAt;
  }
}
