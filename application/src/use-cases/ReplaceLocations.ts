import {
  err,
  ok,
  type Result,
  type ResumeCompany,
  type ResumeCompanyRepository,
  ResumeLocation
} from '@tailoredin/domain';

export type ReplaceLocationsInput = {
  companyId: string;
  locations: { label: string; ordinal: number }[];
};

export class ReplaceLocations {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: ReplaceLocationsInput): Promise<Result<void, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByIdOrFail(input.companyId);
    } catch {
      return err(new Error(`Company not found: ${input.companyId}`));
    }

    company.replaceLocations(input.locations.map(l => new ResumeLocation(l.label, l.ordinal)));
    await this.companyRepository.save(company);
    return ok(undefined);
  }
}
