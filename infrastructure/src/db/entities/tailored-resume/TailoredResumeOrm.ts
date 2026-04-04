import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';

type TailoredResumeOrmProps = {
  id: string;
  profileId: string;
  jdContent: string;
  llmProposals: Record<string, unknown>;
  contentSelection: Record<string, unknown>;
  generatedContent: Record<string, unknown> | null;
  headlineText: string;
  status: string;
  pdfPath: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'tailored_resumes' })
export class TailoredResumeOrm extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'profile_id', type: 'uuid' })
  public readonly profileId: string;

  @Property({ name: 'jd_content', type: 'text' })
  public jdContent: string;

  @Property({ name: 'llm_proposals', type: 'json' })
  public llmProposals: Record<string, unknown>;

  @Property({ name: 'content_selection', type: 'json' })
  public contentSelection: Record<string, unknown>;

  @Property({ name: 'generated_content', type: 'json', nullable: true })
  public generatedContent: Record<string, unknown> | null;

  @Property({ name: 'headline_text', type: 'text', default: '' })
  public headlineText: string;

  @Property({ name: 'status', type: 'text', default: 'draft' })
  public status: string;

  @Property({ name: 'pdf_path', type: 'text', nullable: true })
  public pdfPath: string | null;

  public constructor(props: TailoredResumeOrmProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profileId = props.profileId;
    this.jdContent = props.jdContent;
    this.llmProposals = props.llmProposals;
    this.contentSelection = props.contentSelection;
    this.generatedContent = props.generatedContent;
    this.headlineText = props.headlineText;
    this.status = props.status;
    this.pdfPath = props.pdfPath;
  }
}
