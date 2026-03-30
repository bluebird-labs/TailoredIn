import { ValueObject } from '../ValueObject.js';

export class ResumeCompanyId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ResumeCompanyId {
    return new ResumeCompanyId(crypto.randomUUID());
  }
}
