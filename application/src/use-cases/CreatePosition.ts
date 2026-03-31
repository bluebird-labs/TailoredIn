import { err, ok, type Result, type ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';
import type { ResumePositionDto } from '../dtos/ResumeDataDto.js';

export type CreatePositionInput = {
  companyId: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

export class CreatePosition {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: CreatePositionInput): Promise<Result<ResumePositionDto, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByIdOrFail(input.companyId);
    } catch {
      return err(new Error(`Company not found: ${input.companyId}`));
    }

    const position = company.addPosition({
      title: input.title,
      startDate: input.startDate,
      endDate: input.endDate,
      summary: input.summary,
      ordinal: input.ordinal
    });
    await this.companyRepository.save(company);

    return ok({
      id: position.id.value,
      title: position.title,
      startDate: position.startDate,
      endDate: position.endDate,
      summary: position.summary,
      ordinal: position.ordinal,
      bullets: []
    });
  }
}
