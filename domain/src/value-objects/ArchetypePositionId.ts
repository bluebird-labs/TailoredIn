import { ValueObject } from '../ValueObject.js';

export class ArchetypePositionId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ArchetypePositionId {
    return new ArchetypePositionId(crypto.randomUUID());
  }
}
