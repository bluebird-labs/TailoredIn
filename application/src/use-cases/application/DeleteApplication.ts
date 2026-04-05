import {
  ApplicationId,
  type ApplicationRepository,
  EntityNotFoundError,
  err,
  ok,
  type Result
} from '@tailoredin/domain';

export type DeleteApplicationInput = {
  applicationId: string;
};

export class DeleteApplication {
  public constructor(private readonly applicationRepository: ApplicationRepository) {}

  public async execute(input: DeleteApplicationInput): Promise<Result<void, Error>> {
    try {
      await this.applicationRepository.delete(new ApplicationId(input.applicationId));
      return ok(undefined);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }
  }
}
