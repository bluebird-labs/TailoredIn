import { inject, injectable } from '@needle-di/core';
import type { Login } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class LoginRoute {
  public constructor(private readonly login: Login = inject(DI.Auth.Login)) {}

  public plugin() {
    return new Elysia().post(
      '/auth/login',
      async ({ body }) => {
        const result = await this.login.execute({ email: body.email, password: body.password });
        return { data: result };
      },
      {
        body: t.Object({
          email: t.String({ format: 'email' }),
          password: t.String({ minLength: 1 })
        })
      }
    );
  }
}
