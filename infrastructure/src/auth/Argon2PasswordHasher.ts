import { Injectable } from '@nestjs/common';
import type { PasswordHasher } from '@tailoredin/domain';
import argon2 from 'argon2';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  public async verify(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
