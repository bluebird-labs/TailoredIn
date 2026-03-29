import { ValueObject } from '@tailoredin/domain-shared';

export class ResumeId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): ResumeId {
    return new ResumeId(crypto.randomUUID());
  }
}
