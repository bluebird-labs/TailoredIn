import { ValueObject } from '../ValueObject.js';

export class JobPostingId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): JobPostingId {
    return new JobPostingId(crypto.randomUUID());
  }
}
