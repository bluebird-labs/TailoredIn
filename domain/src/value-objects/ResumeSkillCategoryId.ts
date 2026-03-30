import { ValueObject } from '../ValueObject.js';

export class ResumeSkillCategoryId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ResumeSkillCategoryId {
    return new ResumeSkillCategoryId(crypto.randomUUID());
  }
}
