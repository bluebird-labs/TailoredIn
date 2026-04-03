import { AggregateRoot } from '../AggregateRoot.js';
import { ContentSelection } from '../value-objects/ContentSelection.js';
import { ProfileId } from '../value-objects/ProfileId.js';

export class ResumeProfile extends AggregateRoot<ProfileId> {
  public headlineText: string;
  public contentSelection: ContentSelection;
  public updatedAt: Date;

  public constructor(props: {
    profileId: string;
    headlineText: string;
    contentSelection: ContentSelection;
    updatedAt: Date;
  }) {
    super(new ProfileId(props.profileId));
    this.headlineText = props.headlineText;
    this.contentSelection = props.contentSelection;
    this.updatedAt = props.updatedAt;
  }

  public get profileId(): string {
    return this.id.value;
  }

  public updateHeadline(headlineText: string): void {
    this.headlineText = headlineText;
    this.updatedAt = new Date();
  }

  public replaceContentSelection(contentSelection: ContentSelection): void {
    this.contentSelection = contentSelection;
    this.updatedAt = new Date();
  }

  public static create(profileId: string): ResumeProfile {
    return new ResumeProfile({
      profileId,
      headlineText: '',
      contentSelection: ContentSelection.empty(),
      updatedAt: new Date()
    });
  }
}
