import { type CompanyRepository, EntityNotFoundError, err, ok, type Result } from '@tailoredin/domain';

export type DeleteCompanyInput = {
  companyId: string;
};

export class DeleteCompany {
  public constructor(private readonly companyRepository: CompanyRepository) {}

  public async execute(input: DeleteCompanyInput): Promise<Result<void, Error>> {
    try {
      await this.companyRepository.delete(input.companyId);
      return ok(undefined);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }
  }
}
