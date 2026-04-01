import { ValueObject } from '../ValueObject.js';

export class EducationId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): EducationId {
    return new EducationId(crypto.randomUUID());
  }
}
