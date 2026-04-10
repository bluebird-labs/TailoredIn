import type { ValueObject } from './ValueObject.js';

export abstract class Entity<TId extends ValueObject<{ value: string }>> {
  public readonly id: TId;

  protected constructor(id: TId) {
    this.id = id;
  }

  public equals(other: Entity<TId>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return this.id.equals(other.id);
  }
}
