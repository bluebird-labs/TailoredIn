import type { DomainEvent } from '../DomainEvent.js';
import type { JobStatus } from '../value-objects/JobStatus.js';

export class JobStatusChangedEvent implements DomainEvent {
  public readonly eventName = 'job.status_changed';
  public readonly occurredAt: Date;

  public constructor(
    public readonly jobId: string,
    public readonly oldStatus: JobStatus,
    public readonly newStatus: JobStatus
  ) {
    this.occurredAt = new Date();
  }
}
