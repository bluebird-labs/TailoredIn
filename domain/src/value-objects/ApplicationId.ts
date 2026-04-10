import { ValueObject } from '../ValueObject.js';

export class ApplicationId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public toJSON(): string {
    return this.value;
  }

  public static generate(): ApplicationId {
    return new ApplicationId(crypto.randomUUID());
  }
}
