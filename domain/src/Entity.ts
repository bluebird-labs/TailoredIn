export abstract class Entity {
  public abstract readonly id: string;

  protected constructor() {
    // id is assigned by concrete entity constructors via @PrimaryKey decorator.
    // Stage 3 class field initializers run after super(), so parent
    // assignment would be overwritten by the child's @PrimaryKey field.
  }

  public equals(other: Entity): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return this.id === other.id;
  }
}
