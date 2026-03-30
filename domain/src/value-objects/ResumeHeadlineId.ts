import { ValueObject } from '../ValueObject.js';

export class ResumeHeadlineId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ResumeHeadlineId {
    return new ResumeHeadlineId(crypto.randomUUID());
  }
}
