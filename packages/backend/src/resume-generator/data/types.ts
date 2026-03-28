export enum Archetype {
  HAND_ON_MANAGER = 'hands_on_manager',
  LEADER_MANAGER = 'high_level_manager',
  IC = 'individual_contributor',
  LEAD_IC = 'leader_individual_contributor'
}

export enum JobTitle {
  SOFTWARE_ENGINEER = 'Software Engineer',
  SENIOR_ENGINEER = 'Senior Software Engineer',
  LEAD_ENGINEER = 'Lead Software Engineer',
  STAFF_ENGINEER = 'Staff Software Engineer',
  PRINCIPAL_ENGINEER = 'Principal Software Engineer',
  TECH_LEAD_MANAGER = 'Tech Lead Manager',
  CONSULTANT = 'Software Consultant',

  ENGINEERING_MANAGER = 'Engineering Manager',
  SENIOR_ENGINEERING_MANAGER = 'Senior Engineering Manager',
  DIRECTOR_OF_ENGINEERING = 'Director of Engineering',
  HEAD_OF_ENGINEERING = 'Head of Engineering',
  VICE_PRESIDENT_OF_ENGINEERING = 'Vice President of Engineering'
}

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
