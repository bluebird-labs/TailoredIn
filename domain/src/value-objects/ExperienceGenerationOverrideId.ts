import { ValueObject } from '../ValueObject.js';

export class ExperienceGenerationOverrideId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ExperienceGenerationOverrideId {
    return new ExperienceGenerationOverrideId(crypto.randomUUID());
  }
}
