import { ValueObject } from '../ValueObject.js';

export class ResumeSkillItemId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static generate(): ResumeSkillItemId {
    return new ResumeSkillItemId(crypto.randomUUID());
  }
}
