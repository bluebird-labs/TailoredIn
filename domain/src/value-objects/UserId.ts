import { ValueObject } from '../ValueObject.js';

export class UserId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }
}
