import type { DomainEvent } from '@tailoredin/domain-shared';

export class JobScrapedEvent implements DomainEvent {
  readonly eventName = 'job.scraped';
  readonly occurredAt: Date;

  constructor(
    public readonly linkedinId: string,
    public readonly companyName: string
  ) {
    this.occurredAt = new Date();
  }
}
