import { ValueObject } from '../ValueObject.js';

export class ResumeSkillCategoryId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): ResumeSkillCategoryId {
    return new ResumeSkillCategoryId(crypto.randomUUID());
  }
}
