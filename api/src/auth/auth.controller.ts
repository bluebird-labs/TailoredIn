import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import type { Login } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Public } from '../common/decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  public constructor(@Inject(DI.Auth.Login) private readonly login: Login) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  public async handleLogin(@Body() body: LoginDto) {
    const data = await this.login.execute({ email: body.email, password: body.password });
    return { data };
  }
}
