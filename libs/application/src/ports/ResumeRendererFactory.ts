import type { ResumeRenderer } from './ResumeRenderer.js';

export type ResumeTheme = 'brilliant-cv' | 'imprecv' | 'modern-cv' | 'linked-cv';
export const DEFAULT_RESUME_THEME: ResumeTheme = 'brilliant-cv';

export interface ResumeRendererFactory {
  get(theme: ResumeTheme): ResumeRenderer;
}
