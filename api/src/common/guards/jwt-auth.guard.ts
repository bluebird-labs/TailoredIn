import { type CanActivate, type ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TokenIssuer } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    @Inject(DI.Auth.TokenIssuer) private readonly tokenIssuer: TokenIssuer
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = header.slice(7);
    try {
      const payload = this.tokenIssuer.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Authentication required');
    }
  }
}
