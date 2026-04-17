import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import type { GetGenerationSettings, UpdateGenerationSettings } from '@tailoredin/application';
import type { GenerationScope, ModelTier } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UpdateGenerationSettingsDto } from './dto/update-generation-settings.dto.js';

@Controller('generation-settings')
export class GenerationSettingsController {
  public constructor(
    @Inject(DI.GenerationSettings.Get) private readonly getSettings: GetGenerationSettings,
    @Inject(DI.GenerationSettings.Update) private readonly updateSettings: UpdateGenerationSettings
  ) {}

  @Get()
  public async get(@CurrentUser() user: AuthUser) {
    const data = await this.getSettings.execute({ profileId: user.profileId });
    return { data };
  }

  @Put()
  public async update(@CurrentUser() user: AuthUser, @Body() body: UpdateGenerationSettingsDto) {
    const data = await this.updateSettings.execute({
      profileId: user.profileId,
      modelTier: body.model_tier as ModelTier | undefined,
      bulletMin: body.bullet_min,
      bulletMax: body.bullet_max,
      prompts: body.prompts?.map(p => ({
        scope: p.scope as GenerationScope,
        content: p.content
      }))
    });
    return { data };
  }
}
