import OpenAI, { ClientOptions }        from 'openai';
import { decorate, inject, injectable } from 'inversify';
import { DI }                           from '../di/DI';
import { IAiProvider }                  from './AiProvider';

decorate(injectable(), OpenAI);

@injectable()
export class OpenAiProvider extends OpenAI implements IAiProvider {
  public constructor(
    @inject(DI.OpenAiConfig) config: ClientOptions
  ) {
    super(config);
  }
}
