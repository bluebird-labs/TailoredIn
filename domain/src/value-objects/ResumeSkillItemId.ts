import { ValueObject } from '../ValueObject.js';

export class ResumeSkillItemId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ResumeSkillItemId {
    return new ResumeSkillItemId(crypto.randomUUID());
  }
}
