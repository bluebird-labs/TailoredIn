import { ValueObject } from '../ValueObject.js';

export class ArchetypeConfigId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): ArchetypeConfigId {
    return new ArchetypeConfigId(crypto.randomUUID());
  }
}
