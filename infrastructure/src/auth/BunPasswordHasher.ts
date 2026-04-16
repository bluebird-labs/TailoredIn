import { injectable } from '@needle-di/core';
import type { PasswordHasher } from '@tailoredin/domain';

@injectable()
export class BunPasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return Bun.password.hash(password);
  }

  public async verify(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
  }
}
