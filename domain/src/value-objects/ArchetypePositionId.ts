import { ValueObject } from '../ValueObject.js';

export class ArchetypePositionId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): ArchetypePositionId {
    return new ArchetypePositionId(crypto.randomUUID());
  }
}
