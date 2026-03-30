import { ValueObject } from '../ValueObject.js';

/** Ratio of matched keywords to total keywords (0–1). */
export class TailoringScore extends ValueObject<{ ratio: number }> {
  public constructor(matched: number, total: number) {
    if (total < 0) throw new Error('Total keywords must be non-negative');
    super({ ratio: total === 0 ? 0 : matched / total });
  }

  public get ratio(): number {
    return this.props.ratio;
  }

  public get percentage(): number {
    return Math.round(this.props.ratio * 100);
  }
}
