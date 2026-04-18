import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  public health() {
    return { ok: true, now: new Date() };
  }

  @Public()
  @Get('config')
  public config() {
    return {};
  }
}
