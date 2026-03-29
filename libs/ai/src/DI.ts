import { InjectionToken } from '@needle-di/core';
import type { ClientOptions } from 'openai';
import type { IAiProvider } from './AiProvider.js';
import type { JobInsightsExtractor } from './JobInsightsExtractor.js';
import type { WebsiteColorsFinder } from './WebsiteColorsFinder.js';

export const AiDI = {
  AiProvider: new InjectionToken<IAiProvider>('AiDI.AiProvider'),
  OpenAiConfig: new InjectionToken<ClientOptions>('AiDI.OpenAiConfig'),
  JobInsightsExtractor: new InjectionToken<JobInsightsExtractor>('AiDI.JobInsightsExtractor'),
  WebsiteColorsFinder: new InjectionToken<WebsiteColorsFinder>('AiDI.WebsiteColorsFinder')
};
