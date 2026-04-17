import { Injectable } from '@nestjs/common';
import type { PasswordHasher } from '@tailoredin/domain';

@Injectable()
export class BunPasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return Bun.password.hash(password);
  }

  public async verify(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
  }
}
