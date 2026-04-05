import { ValueObject } from '../ValueObject.js';

export class SalaryRange extends ValueObject<{ min: number | null; max: number | null; currency: string }> {
  public constructor(props: { min: number | null; max: number | null; currency: string }) {
    super(props);
  }

  public get min(): number | null {
    return this.props.min;
  }

  public get max(): number | null {
    return this.props.max;
  }

  public get currency(): string {
    return this.props.currency;
  }
}
