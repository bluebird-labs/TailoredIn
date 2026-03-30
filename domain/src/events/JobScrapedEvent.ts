import type { DomainEvent } from '../DomainEvent.js';

export class JobScrapedEvent implements DomainEvent {
  public readonly eventName = 'job.scraped';
  public readonly occurredAt: Date;

  public constructor(
    public readonly linkedinId: string,
    public readonly companyName: string
  ) {
    this.occurredAt = new Date();
  }
}
