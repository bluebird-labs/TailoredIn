import { ValueObject } from '../ValueObject.js';

export class JobDescriptionId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public toJSON(): string {
    return this.value;
  }

  public static generate(): JobDescriptionId {
    return new JobDescriptionId(crypto.randomUUID());
  }
}
