import { AggregateRoot } from '../AggregateRoot.js';
import { ResumeGeneratedEvent } from '../events/ResumeGeneratedEvent.js';
import type { Archetype } from '../value-objects/Archetype.js';
import { ResumeId } from '../value-objects/ResumeId.js';

export type ResumeCreateProps = {
  jobId: string;
  archetype: Archetype;
  keywords: string[];
  outputPath: string;
};

export class Resume extends AggregateRoot<ResumeId> {
  public readonly jobId: string;
  public readonly archetype: Archetype;
  public readonly keywords: string[];
  public readonly outputPath: string;
  public readonly generatedAt: Date;

  constructor(props: {
    id: ResumeId;
    jobId: string;
    archetype: Archetype;
    keywords: string[];
    outputPath: string;
    generatedAt: Date;
  }) {
    super(props.id);
    this.jobId = props.jobId;
    this.archetype = props.archetype;
    this.keywords = props.keywords;
    this.outputPath = props.outputPath;
    this.generatedAt = props.generatedAt;
  }

  static create(props: ResumeCreateProps): Resume {
    const resume = new Resume({
      id: ResumeId.generate(),
      jobId: props.jobId,
      archetype: props.archetype,
      keywords: props.keywords,
      outputPath: props.outputPath,
      generatedAt: new Date()
    });
    resume.addDomainEvent(new ResumeGeneratedEvent(resume.id.value, props.jobId, props.outputPath));
    return resume;
  }
}
