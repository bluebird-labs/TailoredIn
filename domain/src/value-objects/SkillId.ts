import { ValueObject } from '../ValueObject.js';

export class SkillId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): SkillId {
    return new SkillId(crypto.randomUUID());
  }
}
