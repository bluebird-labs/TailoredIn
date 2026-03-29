import { execSync } from 'node:child_process';
import FS from 'node:fs/promises';
import Path from 'node:path';
import { inject, injectable } from '@needle-di/core';
import { AiDI, PaletteKey, type VibrantSwatch } from '@tailoredin/ai';
import { Archetype, type Company, type Job } from '@tailoredin/db';
import { ColorUtil, EnumUtil } from '@tailoredin/shared';
import { format } from 'date-fns';
import { snakeCase } from 'lodash';
import * as NpmLog from 'npmlog';
import type { BrilliantCVContent } from '../brilliant-cv/types.js';
import { TypstFileGenerator } from './TypstFileGenerator.js';
import { makeResumeContent } from './templates/makeResumeContent.js';

const TYPST_CWD = Path.resolve(import.meta.dirname, '..', 'typst');
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
  constructor(
    private readonly jobInsightsExtractor = inject(AiDI.JobInsightsExtractor),
    private readonly websiteColorsFinder = inject(AiDI.WebsiteColorsFinder)
  ) {}

  public generateRawResumeContent(input: GenerateRawResumeContentInput): BrilliantCVContent {
    return makeResumeContent({
      archetype: input.archetype,
      awesome_color: input.awesomeColor,
      keywords: input.keywords
    });
  }

  public async generateSmartResumeContent(input: GenerateSmartResumeContentInput): Promise<BrilliantCVContent> {
    NpmLog.info(this.constructor.name, `Gathering job posting insights...`);

    const jobPostingInsights = await this.jobInsightsExtractor.extractJobPostingInsights(input);

    NpmLog.info(this.constructor.name, `Gathered job posting insights:`, jobPostingInsights);

    const tmpResume = this.generateRawResumeContent({
      company: input.company,
      archetype: jobPostingInsights.archetype,
      keywords: [],
      awesomeColor: DEFAULT_AWESOME_COLOR
    });

    NpmLog.info(this.constructor.name, `Gathering job application insights...`);

    const jobApplicationInsights = await this.jobInsightsExtractor.extractApplicationInsights({
      resume: tmpResume,
      job: input.job,
      company: input.company
    });

    NpmLog.info(this.constructor.name, `Gathered job application insights:`, jobApplicationInsights);

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

    NpmLog.info(this.constructor.name, `Gathering website palette...`);

    try {
      const swatchPalette = await this.websiteColorsFinder.findWebsitePalette({ website });

      const rgbByPaletteKey = new Map<PaletteKey, ColorUtil.RGBTriple>();

      for (const [name, swatch] of Object.entries(swatchPalette) as [string, VibrantSwatch | null][]) {
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
    } catch (err: unknown) {
      NpmLog.warn(this.constructor.name, `Error extracting color palette from ${website}`, err);
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
