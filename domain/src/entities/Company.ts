import { AggregateRoot } from '../AggregateRoot.js';
import { CompanyId } from '../value-objects/CompanyId.js';

export type CompanyCreateProps = {
  name: string;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string;
};

export class Company extends AggregateRoot<CompanyId> {
  public name: string;
  public website: string | null;
  public logoUrl: string | null;
  public readonly linkedinLink: string;
  public readonly ignored: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: CompanyId;
    name: string;
    website: string | null;
    logoUrl: string | null;
    linkedinLink: string;
    ignored: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.name = props.name;
    this.website = props.website;
    this.logoUrl = props.logoUrl;
    this.linkedinLink = props.linkedinLink;
    this.ignored = props.ignored;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public setWebsite(value: string): void {
    this.website = value;
    this.updatedAt = new Date();
  }

  public static create(props: CompanyCreateProps): Company {
    const now = new Date();
    return new Company({
      id: CompanyId.generate(),
      name: props.name,
      website: props.website,
      logoUrl: props.logoUrl,
      linkedinLink: props.linkedinLink,
      ignored: false,
      createdAt: now,
      updatedAt: now
    });
  }
}
