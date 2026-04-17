import { Injectable } from '@nestjs/common';
import type { ResumeRenderer, ResumeRendererFactory, ResumeTheme } from '@tailoredin/application';
import { BrilliantCvRenderer } from './renderers/BrilliantCvRenderer.js';
import { ImprecvRenderer } from './renderers/ImprecvRenderer.js';
import { LinkedCvRenderer } from './renderers/LinkedCvRenderer.js';
import { ModernCvRenderer } from './renderers/ModernCvRenderer.js';

@Injectable()
export class TypstResumeRendererFactory implements ResumeRendererFactory {
  private readonly brilliantCv = new BrilliantCvRenderer();
  private readonly imprecv = new ImprecvRenderer();
  private readonly modernCv = new ModernCvRenderer();
  private readonly linkedCv = new LinkedCvRenderer();

  public get(theme: ResumeTheme): ResumeRenderer {
    switch (theme) {
      case 'brilliant-cv':
        return this.brilliantCv;
      case 'imprecv':
        return this.imprecv;
      case 'modern-cv':
        return this.modernCv;
      case 'linked-cv':
        return this.linkedCv;
    }
  }
}
