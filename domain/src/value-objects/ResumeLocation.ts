import { ValueObject } from '../ValueObject.js';

export class ResumeLocation extends ValueObject<{ label: string; ordinal: number }> {
  constructor(label: string, ordinal: number) {
    super({ label, ordinal });
  }

  get label(): string {
    return this.props.label;
  }

  get ordinal(): number {
    return this.props.ordinal;
  }
}
