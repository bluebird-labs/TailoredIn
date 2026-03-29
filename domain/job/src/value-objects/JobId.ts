import { ValueObject } from '@tailoredin/domain-shared';

export class JobId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): JobId {
    return new JobId(crypto.randomUUID());
  }
}
