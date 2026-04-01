import { ValueObject } from '../ValueObject.js';

export class BulletVariantId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): BulletVariantId {
    return new BulletVariantId(crypto.randomUUID());
  }
}
