import {
  err,
  ok,
  type Result,
  type ResumeCompany,
  type ResumeCompanyRepository,
  type ResumePosition
} from '@tailoredin/domain';

export type UpdatePositionInput = {
  companyId: string;
  positionId: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  summary?: string | null;
  ordinal?: number;
};

export class UpdatePosition {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: UpdatePositionInput): Promise<Result<void, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByIdOrFail(input.companyId);
    } catch {
      return err(new Error(`Company not found: ${input.companyId}`));
    }

    let position: ResumePosition;
    try {
      position = company.findPositionOrFail(input.positionId);
    } catch (e) {
      return err(e as Error);
    }

    if (input.title !== undefined) position.title = input.title;
    if (input.startDate !== undefined) position.startDate = input.startDate;
    if (input.endDate !== undefined) position.endDate = input.endDate;
    if (input.summary !== undefined) position.summary = input.summary;
    if (input.ordinal !== undefined) position.ordinal = input.ordinal;
    position.updatedAt = new Date();

    await this.companyRepository.save(company);
    return ok(undefined);
  }
}
