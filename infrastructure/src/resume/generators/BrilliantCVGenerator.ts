import type { ResumeContentDto } from '@tailoredin/application';
import type { TemplateGenerator } from '../TemplateGenerator.js';
import { TypstFileGenerator } from '../TypstFileGenerator.js';

export class BrilliantCVGenerator implements TemplateGenerator {
  public async generate(content: ResumeContentDto, workDir: string): Promise<void> {
    await TypstFileGenerator.generate(content, workDir);
  }
}
