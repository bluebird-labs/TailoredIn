import { ValueObject } from '../ValueObject.js';

export class ResumeBulletId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): ResumeBulletId {
    return new ResumeBulletId(crypto.randomUUID());
  }
}
