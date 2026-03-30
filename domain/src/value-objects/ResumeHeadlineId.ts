import { ValueObject } from '../ValueObject.js';

export class ResumeHeadlineId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): ResumeHeadlineId {
    return new ResumeHeadlineId(crypto.randomUUID());
  }
}
