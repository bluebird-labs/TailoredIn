import { ValueObject } from '@tailoredin/domain-shared';

export class CompanyId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): CompanyId {
    return new CompanyId(crypto.randomUUID());
  }
}
