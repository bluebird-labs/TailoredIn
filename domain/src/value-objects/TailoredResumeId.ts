import { ValueObject } from '../ValueObject.js';

export class TailoredResumeId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): TailoredResumeId {
    return new TailoredResumeId(crypto.randomUUID());
  }
}
