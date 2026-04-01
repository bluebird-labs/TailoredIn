import { ValueObject } from '../ValueObject.js';

export class ArchetypeId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ArchetypeId {
    return new ArchetypeId(crypto.randomUUID());
  }
}
