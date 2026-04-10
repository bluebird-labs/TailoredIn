import type { ValueObject } from './ValueObject.js';

export abstract class Entity<TId extends ValueObject<{ value: string }>> {
  public abstract readonly id: TId;

  // biome-ignore lint/correctness/noUnusedVariables: parameter kept for constructor signature compatibility
  protected constructor(_id: TId) {
    // id is assigned by concrete entity constructors, not here.
    // Stage 3 class field initializers run after super(), so parent
    // assignment would be overwritten by the child's @PrimaryKey field.
  }

  public equals(other: Entity<TId>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return this.id.equals(other.id);
  }
}
