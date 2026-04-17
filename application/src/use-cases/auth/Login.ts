import { Inject, Injectable } from '@nestjs/common';
import type { AccountRepository, PasswordHasher } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';
import type { TokenIssuer } from '../../ports/TokenIssuer.js';

export type LoginInput = { email: string; password: string };
export type LoginOutput = { token: string; expiresIn: number };

@Injectable()
export class Login {
  public constructor(
    @Inject(DI.Auth.Repository) private readonly accountRepository: AccountRepository,
    @Inject(DI.Auth.PasswordHasher) private readonly passwordHasher: PasswordHasher,
    @Inject(DI.Auth.TokenIssuer) private readonly tokenIssuer: TokenIssuer
  ) {}

  public async execute(input: LoginInput): Promise<LoginOutput> {
    const account = await this.accountRepository.findByEmail(input.email);
    if (!account) throw new AuthenticationError();

    const valid = await account.verifyPassword(input.password, this.passwordHasher);
    if (!valid) throw new AuthenticationError();

    return this.tokenIssuer.issue({ accountId: account.id, profileId: account.profileId });
  }
}
