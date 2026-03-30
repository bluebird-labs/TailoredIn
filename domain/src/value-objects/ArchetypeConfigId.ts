import { ValueObject } from '../ValueObject.js';

export class ArchetypeConfigId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ArchetypeConfigId {
    return new ArchetypeConfigId(crypto.randomUUID());
  }
}
