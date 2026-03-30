import { ValueObject } from '../ValueObject.js';

export class ResumeEducationId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ResumeEducationId {
    return new ResumeEducationId(crypto.randomUUID());
  }
}
