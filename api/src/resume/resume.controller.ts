import { Body, Controller, Get, HttpException, Inject, Param, Patch, Post, Res, StreamableFile } from '@nestjs/common';
import {
  type GenerateResumeContentWithPdf,
  type GenerateResumePdf,
  type GetCachedResumePdf,
  ResumeNotReadyError,
  type ScoreResume,
  type UpdateResumeDisplaySettings
} from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import type { Response } from 'express';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import { GenerateResumeContentDto } from './dto/generate-resume-content.dto.js';
import { GenerateResumePdfDto } from './dto/generate-resume-pdf.dto.js';
import { UpdateDisplaySettingsDto } from './dto/update-display-settings.dto.js';

@Controller('resume')
export class ResumeController {
  public constructor(
    @Inject(DI.Resume.GenerateContentWithPdf) private readonly generateContent: GenerateResumeContentWithPdf,
    @Inject(DI.Resume.GeneratePdf) private readonly generatePdf: GenerateResumePdf,
    @Inject(DI.Resume.GetCachedPdf) private readonly getCachedPdf: GetCachedResumePdf,
    @Inject(DI.Resume.UpdateDisplaySettings) private readonly updateDisplaySettings: UpdateResumeDisplaySettings,
    @Inject(DI.Resume.Score) private readonly scoreResume: ScoreResume
  ) {}

  @Post('generate')
  public async generate(@CurrentUser() user: AuthUser, @Body() body: GenerateResumeContentDto) {
    try {
      const data = await this.generateContent.execute({
        profileId: user.profileId,
        jobDescriptionId: body.jobDescriptionId,
        additionalPrompt: body.additionalPrompt,
        customInstructions: body.customInstructions,
        scope: body.scope
      });
      return { data };
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Post('pdf')
  public async pdf(
    @CurrentUser() user: AuthUser,
    @Body() body: GenerateResumePdfDto,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const pdf = await this.generatePdf.execute({
        profileId: user.profileId,
        jobDescriptionId: body.jobDescriptionId,
        theme: body.theme
      });
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"'
      });
      return new StreamableFile(Buffer.from(pdf as Buffer));
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Get('pdf/:jobDescriptionId')
  public async getCachedPdfHandler(
    @Param('jobDescriptionId') jobDescriptionId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.getCachedPdf.execute({ jobDescriptionId });
    if (!result) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: 'No cached PDF available' } }, 404);
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="resume.pdf"'
    });
    return new StreamableFile(Buffer.from(result.pdf as Buffer));
  }

  @Patch('display-settings')
  public async displaySettings(@Body() body: UpdateDisplaySettingsDto) {
    try {
      await this.updateDisplaySettings.execute({
        jobDescriptionId: body.jobDescriptionId,
        experienceHiddenBullets: body.experienceHiddenBullets,
        hiddenEducationIds: body.hiddenEducationIds
      });
      return { data: { success: true } };
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Post(':id/score')
  public async score(@Param('id') id: string) {
    try {
      const data = await this.scoreResume.execute({ resumeContentId: id });
      return { data };
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      if (e instanceof ResumeNotReadyError) {
        throw new HttpException({ error: { code: 'NOT_READY', message: e.message } }, 409);
      }
      throw e;
    }
  }
}
