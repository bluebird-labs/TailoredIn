import type { DomainEvent } from './DomainEvent.js';
import { Entity } from './Entity.js';
import type { ValueObject } from './ValueObject.js';

export abstract class AggregateRoot<TId extends ValueObject<{ value: string }>> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  public get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
