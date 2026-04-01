import { ValueObject } from '../ValueObject.js';

export class SkillCategoryId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): SkillCategoryId {
    return new SkillCategoryId(crypto.randomUUID());
  }
}
