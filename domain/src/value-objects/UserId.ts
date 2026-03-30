import { ValueObject } from '../ValueObject.js';

export class UserId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }
}
