import { ValueObject } from '../ValueObject.js';

export class AccomplishmentId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): AccomplishmentId {
    return new AccomplishmentId(crypto.randomUUID());
  }
}
