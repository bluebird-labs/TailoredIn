import { ValueObject } from '../ValueObject.js';

export class ResumeId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ResumeId {
    return new ResumeId(crypto.randomUUID());
  }
}
