import { ValueObject } from '../ValueObject.js';

export class ExperienceId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    // Handle mapToPk runtime conversion: MikroORM may pass a ValueObject instead of string
    if (typeof value !== 'string') value = (value as any).value;
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public toJSON(): string {
    return this.value;
  }

  public static generate(): ExperienceId {
    return new ExperienceId(crypto.randomUUID());
  }
}
