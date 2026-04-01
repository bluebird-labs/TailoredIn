import { ValueObject } from '../ValueObject.js';

export class SkillItemId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): SkillItemId {
    return new SkillItemId(crypto.randomUUID());
  }
}
