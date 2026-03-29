import { InjectionToken } from '@needle-di/core';
import type { LlmService } from './ports/LlmService.js';
import type { ResumeContentFactory } from './ports/ResumeContentFactory.js';
import type { ResumeRenderer } from './ports/ResumeRenderer.js';
import type { WebColorService } from './ports/WebColorService.js';
import type { GenerateResume } from './use-cases/GenerateResume.js';

export const ApplicationResumeDI = {
  // Ports
  LlmService: new InjectionToken<LlmService>('ApplicationResumeDI.LlmService'),
  WebColorService: new InjectionToken<WebColorService>('ApplicationResumeDI.WebColorService'),
  ResumeRenderer: new InjectionToken<ResumeRenderer>('ApplicationResumeDI.ResumeRenderer'),
  ResumeContentFactory: new InjectionToken<ResumeContentFactory>('ApplicationResumeDI.ResumeContentFactory'),

  // Use cases
  GenerateResume: new InjectionToken<GenerateResume>('ApplicationResumeDI.GenerateResume')
};
