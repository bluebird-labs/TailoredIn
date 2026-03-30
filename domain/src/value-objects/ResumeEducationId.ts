import { ValueObject } from '../ValueObject.js';

export class ResumeEducationId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): ResumeEducationId {
    return new ResumeEducationId(crypto.randomUUID());
  }
}
