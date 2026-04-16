import type { AccountRepository, PasswordHasher } from '@tailoredin/domain';
import { AuthenticationError } from '../../errors/AuthenticationError.js';
import type { TokenIssuer } from '../../ports/TokenIssuer.js';

export type LoginInput = { email: string; password: string };
export type LoginOutput = { token: string; expiresIn: number };

export class Login {
  public constructor(
    private readonly accountRepository: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer
  ) {}

  public async execute(input: LoginInput): Promise<LoginOutput> {
    const account = await this.accountRepository.findByEmail(input.email);
    if (!account) throw new AuthenticationError();

    const valid = await account.verifyPassword(input.password, this.passwordHasher);
    if (!valid) throw new AuthenticationError();

    return this.tokenIssuer.issue({ accountId: account.id, profileId: account.profileId });
  }
}
