import type { DomainEvent } from '../DomainEvent.js';

export class ResumeGeneratedEvent implements DomainEvent {
  readonly eventName = 'resume.generated';
  readonly occurredAt: Date;

  constructor(
    public readonly resumeId: string,
    public readonly jobId: string,
    public readonly outputPath: string
  ) {
    this.occurredAt = new Date();
  }
}
