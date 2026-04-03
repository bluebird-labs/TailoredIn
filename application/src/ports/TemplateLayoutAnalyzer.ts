import type { LayoutAnalysis, ResumeTemplate } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export interface TemplateLayoutAnalyzer {
  /**
   * Returns a per-block layout analysis for the given template and content.
   * Results are cached in-memory by (template.id + contentHash).
   */
  analyze(template: ResumeTemplate, content: ResumeContentDto): Promise<LayoutAnalysis>;
}
