import { AggregateRoot } from '../AggregateRoot.js';
import { ArchetypeId } from '../value-objects/ArchetypeId.js';
import { ContentSelection } from '../value-objects/ContentSelection.js';
import { TagProfile } from '../value-objects/TagProfile.js';

export type Archetype2CreateProps = {
  profileId: string;
  key: string;
  label: string;
};

export class Archetype2 extends AggregateRoot<ArchetypeId> {
  public readonly profileId: string;
  public key: string;
  public label: string;
  public headlineId: string | null;
  public tagProfile: TagProfile;
  public contentSelection: ContentSelection;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ArchetypeId;
    profileId: string;
    key: string;
    label: string;
    headlineId: string | null;
    tagProfile: TagProfile;
    contentSelection: ContentSelection;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.key = props.key;
    this.label = props.label;
    this.headlineId = props.headlineId;
    this.tagProfile = props.tagProfile;
    this.contentSelection = props.contentSelection;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateMetadata(key: string, label: string, headlineId: string | null): void {
    this.key = key;
    this.label = label;
    this.headlineId = headlineId;
    this.updatedAt = new Date();
  }

  public replaceTagProfile(tagProfile: TagProfile): void {
    this.tagProfile = tagProfile;
    this.updatedAt = new Date();
  }

  public replaceContentSelection(contentSelection: ContentSelection): void {
    this.contentSelection = contentSelection;
    this.updatedAt = new Date();
  }

  public static create(props: Archetype2CreateProps): Archetype2 {
    const now = new Date();
    return new Archetype2({
      id: ArchetypeId.generate(),
      profileId: props.profileId,
      key: props.key,
      label: props.label,
      headlineId: null,
      tagProfile: TagProfile.empty(),
      contentSelection: ContentSelection.empty(),
      createdAt: now,
      updatedAt: now
    });
  }
}
