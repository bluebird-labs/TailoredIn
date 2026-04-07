import { ValueObject } from '../ValueObject.js';

export class GenerationPromptId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): GenerationPromptId {
    return new GenerationPromptId(crypto.randomUUID());
  }
}
