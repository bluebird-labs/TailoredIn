import { ValueObject } from '../ValueObject.js';

export class HeadlineId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): HeadlineId {
    return new HeadlineId(crypto.randomUUID());
  }
}
