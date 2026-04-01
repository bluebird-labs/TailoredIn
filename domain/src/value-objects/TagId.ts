import { ValueObject } from '../ValueObject.js';

export class TagId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): TagId {
    return new TagId(crypto.randomUUID());
  }
}
