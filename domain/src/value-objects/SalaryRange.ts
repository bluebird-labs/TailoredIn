import { ValidationError } from '../ValidationError.js';
import { ValueObject } from '../ValueObject.js';

export class SalaryRange extends ValueObject<{ min: number | null; max: number | null; currency: string }> {
  public constructor(props: { min: number | null; max: number | null; currency: string }) {
    if (props.min !== null && props.min < 0) throw new ValidationError('salaryMin', 'must be >= 0');
    if (props.max !== null && props.max < 0) throw new ValidationError('salaryMax', 'must be >= 0');
    if (props.min !== null && props.max !== null && props.max < props.min)
      throw new ValidationError('salaryMax', 'must be >= salaryMin');
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

  public toJSON(): { min: number | null; max: number | null; currency: string } {
    return { min: this.min, max: this.max, currency: this.currency };
  }
}
