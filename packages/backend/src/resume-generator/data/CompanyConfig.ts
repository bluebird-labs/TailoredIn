import { CompanyConfigInput, JobTitle } from './types';
import { RawExperience } from '../../../brilliant-cv/types';

export type CompanyPositionInput<B extends string, L extends string> = {
  company: string;
  position: JobTitle;
  start_date: string;
  end_date: string;
  location: L;
  highlights: B[];
  summary: string;
};

export class CompanyConfig<B extends string, L extends string> {
  private constructor(private readonly config: CompanyConfigInput<B, L>) {}

  public static create<B extends string, L extends string>(input: CompanyConfigInput<B, L>): CompanyConfig<B, L> {
    return new CompanyConfig(input);
  }

  public nakedName() {
    return this.config.name;
  }

  public nameWithMention() {
    if (this.config.mention === null) {
      return this.nakedName();
    }
    return `${this.nakedName()} #smallcaps[(${this.config.mention})]`;
  }

  public joined(): string {
    return this.config.dates.joined;
  }

  public left(): string {
    return this.config.dates.left;
  }

  public promoted() {
    if (this.config.dates.promoted === null) {
      throw new Error(`No promotion date defined for ${this.nakedName()}`);
    }
    return this.config.dates.promoted;
  }

  public position(input: CompanyPositionInput<B, L>): RawExperience {
    return input;
  }
}
