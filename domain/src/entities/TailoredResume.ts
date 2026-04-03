import { AggregateRoot } from '../AggregateRoot.js';
import { ContentSelection } from '../value-objects/ContentSelection.js';
import { GeneratedContent } from '../value-objects/GeneratedContent.js';
import { LlmProposal } from '../value-objects/LlmProposal.js';
import { TailoredResumeId } from '../value-objects/TailoredResumeId.js';

export type TailoredResumeStatus = 'draft' | 'finalized';

export class TailoredResume extends AggregateRoot<TailoredResumeId> {
  public readonly profileId: string;
  public jdContent: string;
  public llmProposals: LlmProposal;
  public contentSelection: ContentSelection;
  public generatedContent: GeneratedContent;
  public headlineText: string;
  public status: TailoredResumeStatus;
  public pdfPath: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: TailoredResumeId;
    profileId: string;
    jdContent: string;
    llmProposals: LlmProposal;
    contentSelection: ContentSelection;
    generatedContent: GeneratedContent;
    headlineText: string;
    status: TailoredResumeStatus;
    pdfPath: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.jdContent = props.jdContent;
    this.llmProposals = props.llmProposals;
    this.contentSelection = props.contentSelection;
    this.generatedContent = props.generatedContent;
    this.headlineText = props.headlineText;
    this.status = props.status;
    this.pdfPath = props.pdfPath;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateProposals(llmProposals: LlmProposal): void {
    this.llmProposals = llmProposals;
    this.updatedAt = new Date();
  }

  public replaceContentSelection(contentSelection: ContentSelection): void {
    this.contentSelection = contentSelection;
    this.updatedAt = new Date();
  }

  public updateGeneratedContent(generatedContent: GeneratedContent): void {
    this.generatedContent = generatedContent;
    this.updatedAt = new Date();
  }

  public updateHeadline(headlineText: string): void {
    this.headlineText = headlineText;
    this.updatedAt = new Date();
  }

  public finalize(pdfPath: string): void {
    this.pdfPath = pdfPath;
    this.status = 'finalized';
    this.updatedAt = new Date();
  }

  public static create(props: { profileId: string; jdContent: string }): TailoredResume {
    const now = new Date();
    return new TailoredResume({
      id: TailoredResumeId.generate(),
      profileId: props.profileId,
      jdContent: props.jdContent,
      llmProposals: LlmProposal.empty(),
      contentSelection: ContentSelection.empty(),
      generatedContent: GeneratedContent.empty(),
      headlineText: '',
      status: 'draft',
      pdfPath: null,
      createdAt: now,
      updatedAt: now
    });
  }
}
