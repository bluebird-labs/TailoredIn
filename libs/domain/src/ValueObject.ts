export abstract class ValueObject<T extends Record<string, unknown>> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  public equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;

    const keys = Object.keys(this.props) as (keyof T)[];
    if (keys.length !== Object.keys(other.props).length) return false;
    return keys.every(key => Object.is(this.props[key], other.props[key]));
  }
}
