import { ValueObject } from '../ValueObject.js';

export class GenerationSettingsId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): GenerationSettingsId {
    return new GenerationSettingsId(crypto.randomUUID());
  }
}
