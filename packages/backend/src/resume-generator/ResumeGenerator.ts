import { JobInsightsExtractor }          from '../services/JobInsightsExtractor';
import { BrilliantCVContent }            from '../../brilliant-cv/types';
import Path                              from 'node:path';
import { snakeCase }                     from 'lodash';
import { format }                        from 'date-fns';
import { makeResumeContent }             from './templates/makeResumeContent';
import { Archetype }                     from './data/types';
import { PaletteKey, WebsiteColorsFinder } from '../services/WebsiteColorsFinder';
import * as NPMLog                       from 'npmlog';
import { TypstFileGenerator }            from './TypstFileGenerator';
import FS                                from 'node:fs/promises';
import { execSync }                      from 'child_process';
import { ColorUtil }                     from '../utils/ColorUtil';
import { EnumUtil }                      from '../utils/EnumUtil';
import { Company }                       from '../orm/entities/companies/Company';
import { Job }                           from '../orm/entities/jobs/Job';
import { inject, injectable }            from 'inversify';
import { DI }                            from '../di/DI';

const TYPST_CWD = Path.resolve(__dirname, '../..', 'typst');
const DEFAULT_AWESOME_COLOR = '#178FEA';

export type GenerateRawResumeContentInput = {
  company: Company;
  archetype: Archetype;
  keywords: string[];
  awesomeColor: string;
};

export type GenerateSmartResumeContentInput = {
  job: Job;
  company: Company;
};

@injectable()
export class ResumeGenerator {
  public constructor(
    @inject(DI.JobInsightsExtractor) private readonly jobInsightsExtractor: JobInsightsExtractor,
    @inject(DI.WebsiteColorsFinder) private readonly websiteColorsFinder: WebsiteColorsFinder
  ) {}

  public generateRawResumeContent(input: GenerateRawResumeContentInput): BrilliantCVContent {
    return makeResumeContent({
      archetype: input.archetype,
      awesome_color: input.awesomeColor,
      keywords: input.keywords
    });
  }

  public async generateSmartResumeContent(input: GenerateSmartResumeContentInput): Promise<BrilliantCVContent> {
    NPMLog.info(this.constructor.name, `Gathering job posting insights...`);

    const jobPostingInsights = await this.jobInsightsExtractor.extractJobPostingInsights(input);

    NPMLog.info(this.constructor.name, `Gathered job posting insights:`, jobPostingInsights);

    const tmpResume = this.generateRawResumeContent({
      company: input.company,
      archetype: jobPostingInsights.archetype,
      keywords: [],
      awesomeColor: DEFAULT_AWESOME_COLOR
    });

    NPMLog.info(this.constructor.name, `Gathering job application insights...`);

    const jobApplicationInsights = await this.jobInsightsExtractor.extractApplicationInsights({
      resume: tmpResume,
      job: input.job,
      company: input.company
    });

    NPMLog.info(this.constructor.name, `Gathered job application insights:`, jobApplicationInsights);

    const awesomeColor = (await this.extractResumeColors(jobPostingInsights.website)) ?? DEFAULT_AWESOME_COLOR;

    return this.generateRawResumeContent({
      archetype: jobPostingInsights.archetype,
      company: input.company,
      awesomeColor,
      keywords: jobApplicationInsights.keywords
    });
  }

  public async generateRawResume(input: GenerateRawResumeContentInput): Promise<string> {
    const content = this.generateRawResumeContent(input);
    return this.storeResumeContent(content, input.company, input.archetype);
  }

  public async generateSmartResume(input: GenerateSmartResumeContentInput): Promise<string> {
    const content = await this.generateSmartResumeContent(input);
    return this.storeResumeContent(content, input.company, Archetype.LEAD_IC);
  }

  public async extractResumeColors(website: string | null): Promise<string | null> {
    if (website === null) return null;

    NPMLog.info(this.constructor.name, `Gathering website palette...`);

    try {
      const swatchPalette = await this.websiteColorsFinder.findWebsitePalette({ website });

      const rgbByPaletteKey = new Map<PaletteKey, ColorUtil.RGBTriple>();

      for (const [name, swatch] of Object.entries(swatchPalette)) {
        if (swatch !== null && EnumUtil.is(name, PaletteKey)) {
          const isTitle = ColorUtil.meetsWCAGLargeTextContrastRatio(ColorUtil.PURE_WHITE_RGB, swatch.rgb);
          const isGrayish = ColorUtil.isRgbGrayish(swatch.rgb);
          if (!isGrayish && isTitle) {
            rgbByPaletteKey.set(name, swatch.rgb);
          }
        }
      }

      for (const key of [PaletteKey.VIBRANT, PaletteKey.DARK_VIBRANT, PaletteKey.LIGHT_VIBRANT]) {
        if (rgbByPaletteKey.has(key)) {
          return ColorUtil.rgbTripleToHex(rgbByPaletteKey.get(key)!);
        }
      }
    } catch (err: Error | any) {
      NPMLog.warn(this.constructor.name, `Error extracting color palette from ${website}`, err);
    }

    return null;
  }

  private async storeResumeContent(
    content: BrilliantCVContent,
    company: Company,
    archetype: Archetype
  ): Promise<string> {
    const outputDir = Path.resolve(__dirname, '../../resumes/', snakeCase(company.name.toLowerCase()));
    const date = format(new Date(), 'yyyy_MM_dd');
    const pdfPath = Path.resolve(outputDir, `Sylvain_Estevez_${archetype}_${date}.pdf`);

    await FS.mkdir(outputDir, { recursive: true });
    await FS.mkdir(TYPST_CWD, { recursive: true });
    await TypstFileGenerator.generate(content, TYPST_CWD);

    try {
      execSync(`typst compile cv.typ "${pdfPath}"`, { cwd: TYPST_CWD, stdio: 'pipe' });
    } catch (err: any) {
      const stderr = (err.stderr as Buffer | undefined)?.toString() ?? String(err.message);
      throw new Error(`Typst compile failed:\n${stderr}`);
    }

    return pdfPath;
  }
}
