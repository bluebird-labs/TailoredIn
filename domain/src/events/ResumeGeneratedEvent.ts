import type { DomainEvent } from '../DomainEvent.js';

export class ResumeGeneratedEvent implements DomainEvent {
  public readonly eventName = 'resume.generated';
  public readonly occurredAt: Date;

  public constructor(
    public readonly resumeId: string,
    public readonly jobId: string,
    public readonly outputPath: string
  ) {
    this.occurredAt = new Date();
  }
}
