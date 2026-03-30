import { ValueObject } from '../ValueObject.js';

export class ResumeLocation extends ValueObject<{ label: string; ordinal: number }> {
  public constructor(label: string, ordinal: number) {
    super({ label, ordinal });
  }

  public get label(): string {
    return this.props.label;
  }

  public get ordinal(): number {
    return this.props.ordinal;
  }
}
