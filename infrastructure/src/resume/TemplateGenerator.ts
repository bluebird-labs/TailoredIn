import type { ResumeContentDto } from '@tailoredin/application';

export interface TemplateGenerator {
  generate(content: ResumeContentDto, workDir: string): Promise<void>;
}
