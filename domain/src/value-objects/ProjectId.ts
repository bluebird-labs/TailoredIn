import { ValueObject } from '../ValueObject.js';

export class ProjectId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ProjectId {
    return new ProjectId(crypto.randomUUID());
  }
}
