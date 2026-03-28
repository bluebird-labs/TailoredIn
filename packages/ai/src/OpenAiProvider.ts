import OpenAI, { ClientOptions }        from 'openai';
import { decorate, inject, injectable } from 'inversify';
import { AiDI }                         from './DI.js';
import { IAiProvider }                  from './AiProvider.js';

decorate(injectable(), OpenAI);

@injectable()
export class OpenAiProvider extends OpenAI implements IAiProvider {
  public constructor(
    @inject(AiDI.OpenAiConfig) config: ClientOptions
  ) {
    super(config);
  }
}
