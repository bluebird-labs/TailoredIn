import { inject, injectable } from '@needle-di/core';
import OpenAi from 'openai';
import type { IAiProvider } from './AiProvider.js';
import { AiDI } from './DI.js';

@injectable()
export class OpenAiProvider extends OpenAi implements IAiProvider {
  constructor(config = inject(AiDI.OpenAiConfig)) {
    super(config);
  }
}
