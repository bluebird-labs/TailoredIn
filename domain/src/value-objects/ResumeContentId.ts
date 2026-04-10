import { ValueObject } from '../ValueObject.js';

export class ResumeContentId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public toJSON(): string {
    return this.value;
  }

  public static generate(): ResumeContentId {
    return new ResumeContentId(crypto.randomUUID());
  }
}
