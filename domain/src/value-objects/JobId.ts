import { ValueObject } from '../ValueObject.js';

export class JobId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): JobId {
    return new JobId(crypto.randomUUID());
  }
}
