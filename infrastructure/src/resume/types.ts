export type Stack = Record<string, string[]>;

export type Dates = {
  joined: string;
  left: string | 'present';
  promoted: string | null;
};

export type CompanyConfigInput<B extends string, L extends string> = {
  name: string;
  mention: string | null;
  website: string | null;
  domain: string;
  dates: Dates;
  locations: L[];
  bullets: B[];
};
