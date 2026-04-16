# Auth Design — Email/Password with JWT

## Overview

Add email/password authentication with short-lived JWTs. Authentication is a separate concern from Profile, modeled as a new `Account` aggregate linked one-to-one to Profile. All single-user assumptions across the codebase are corrected to use the authenticated user's `profileId`.

Login only — no register, reset password, or delete account.

## Domain Layer

### Account Aggregate

New entity in `domain/src/entities/Account.ts`, table `accounts`:

| Field | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, generated |
| `email` | text | unique index |
| `passwordHash` | text | |
| `profileId` | uuid | unique FK → profiles |
| `createdAt` | timestamp | default CURRENT_TIMESTAMP |
| `updatedAt` | timestamp | default CURRENT_TIMESTAMP |

- Extends `AggregateRoot`
- Constructor validates email format (same regex as Profile)
- `Account.create(props)` factory takes email, **pre-hashed** password, and profileId. Hashing is done by the caller (use case) via the `PasswordHasher` port — this keeps the domain factory synchronous.
- `Account.verifyPassword(plaintext, hasher)` delegates to the `PasswordHasher` port (this method is async since verification requires the port).

Email exists on both Account (login credential) and Profile (resume contact info). They can diverge.

### PasswordHasher Port

New port in `domain/src/ports/PasswordHasher.ts`:

```typescript
interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}
```

### AccountRepository Port

New port in `domain/src/ports/AccountRepository.ts`:

```typescript
interface AccountRepository {
  findByEmail(email: string): Promise<Account | null>;
  findByIdOrFail(id: string): Promise<Account>;
  save(account: Account): Promise<void>;
}
```

### ProfileRepository Changes

Replace `findSingle()` with `findByIdOrFail(id: string)`. All callers updated.

## Application Layer

### Login Use Case

New use case in `application/src/use-cases/auth/Login.ts`:

- Input: `{ email: string, password: string }`
- Looks up Account by email via `AccountRepository.findByEmail()`
- Verifies password via `Account.verifyPassword(password, hasher)`
- On success: delegates to `TokenIssuer` port, returns `{ token: string, expiresIn: number }`
- On failure: throws `AuthenticationError` — same error whether email not found or password wrong (prevents enumeration)

### TokenIssuer Port

New port in `application/src/ports/TokenIssuer.ts`:

```typescript
interface TokenIssuer {
  issue(payload: { accountId: string; profileId: string }): { token: string; expiresIn: number };
  verify(token: string): { accountId: string; profileId: string };
}
```

Lives in application (not domain) because JWT issuance is an application concern.

### AuthenticationError

New error in `application/src/errors/AuthenticationError.ts`:

- Message: "Invalid email or password"
- No distinction between missing account and wrong password

### Existing Use Case Changes

Every use case that currently calls `profileRepository.findSingle()` or receives no user context gains `profileId: string` in its input type:

- `GetProfile` — input gains `profileId`, calls `findByIdOrFail(profileId)`
- `UpdateProfile` — same
- `GenerateResumePdf` — same
- `ScoreJobFit` — same
- `GenerationContextBuilder` — method takes `profileId` instead of fetching it internally

The `profileId` comes from the JWT payload, extracted by middleware and passed through routes.

## Infrastructure Layer

### BcryptPasswordHasher

New implementation in `infrastructure/src/auth/BcryptPasswordHasher.ts`:

- Implements `PasswordHasher` using Bun's built-in `Bun.password.hash()` and `Bun.password.verify()` (argon2id by default)
- No external bcrypt dependency needed

### JwtTokenIssuer

New implementation in `infrastructure/src/auth/JwtTokenIssuer.ts`:

- Implements `TokenIssuer`
- HMAC-SHA256 signing (dependency-free using Bun-native crypto or lightweight library)
- Reads `JWT_SECRET` and `JWT_EXPIRES_IN` from environment via `env()`
- Signs `{ accountId, profileId, iat, exp }`

### PostgresAccountRepository

New implementation in `infrastructure/src/auth/PostgresAccountRepository.ts`:

- Standard `@injectable()` pattern, injects `MikroORM`
- Implements `AccountRepository`

### DI Tokens

New tokens in `infrastructure/src/DI.ts`:

```
DI.Auth.Repository       → AccountRepository
DI.Auth.PasswordHasher   → PasswordHasher
DI.Auth.TokenIssuer      → TokenIssuer
DI.Auth.Login            → Login
```

### Migration

New migration creating `accounts` table:

- `id` uuid PK (default `gen_random_uuid()`)
- `email` text NOT NULL, unique index
- `password_hash` text NOT NULL
- `profile_id` uuid NOT NULL, unique FK → profiles ON DELETE CASCADE
- `created_at` timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP

### Seed Changes

E2eSeeder creates an Account row linked to the existing Jane Doe profile with a known password (`"password123"`) hashed at seed time.

### New Environment Variables

Added to `.env.example`:

- `JWT_SECRET` — signing key for JWTs
- `JWT_EXPIRES_IN` — token lifetime (e.g. `"1h"`)

## API Layer

### LoginRoute

New route in `api/src/routes/auth/LoginRoute.ts`:

- `POST /auth/login`
- Body: `{ email: string, password: string }`
- Success: `{ data: { token: string, expiresIn: number } }`
- Failure: 401 `{ error: { code: "UNAUTHORIZED", message: "Invalid email or password" } }`
- **Unguarded** — no JWT required

### Auth Middleware

Elysia `derive` plugin that:

1. Reads `Authorization: Bearer <token>` header
2. Verifies via `TokenIssuer.verify()`
3. Injects `{ accountId, profileId }` into request context
4. Applied to all routes **except** `POST /auth/login`
5. Missing or invalid token → 401 `UNAUTHORIZED`

### getProfileId() Helper Eliminated

Every route that currently calls `getProfileId()` reads `profileId` from the derived auth context instead.

### Route Updates

All existing routes destructure `profileId` from auth context and pass it to their use case:

```typescript
// Before
const profileId = await getProfileId(db);
const result = await this.getProfile.execute();

// After
const result = await this.getProfile.execute({ profileId: context.profileId });
```

### Error Mapping

`AuthenticationError` → 401 added to `onError` handler in `api/src/index.ts`.

## Web Layer

### API Client

`web/src/lib/api.ts` updated to read JWT from `localStorage` and attach as `Authorization: Bearer <token>` header via treaty's `headers` option.

### Login Page

New route at `/login`:

- Simple form: email + password fields, submit button
- On success: stores token in `localStorage`, redirects to `/jobs`
- On failure: shows inline error message

### Route Guard

Wraps the router to check `localStorage` for a valid token before rendering protected routes:

- No token → redirect to `/login`
- Token present but expired (decoded client-side) → clear and redirect to `/login`

### Logout

Clear `localStorage` token and redirect to `/login`. No server-side endpoint (stateless JWTs).

### No Register Page

Login only. The seeded account is the only way in.

## E2E Test Strategy

E2E tests need to authenticate before hitting protected routes. The Playwright test setup will:

1. Call `POST /auth/login` with the seeded credentials (`jane@example.com` / `password123`) before each test (or in a shared setup fixture)
2. Store the returned JWT and attach it as an `Authorization` header on subsequent API calls, or inject it into `localStorage` before navigating to the app so the route guard passes

## Single-User Assumption Fixes

All locations that assume a single user, updated to use `profileId` from auth context:

| Location | Current | After |
|---|---|---|
| `ProfileRepository.findSingle()` | Returns first profile | Replaced with `findByIdOrFail(id)` |
| `getProfileId()` helper | `SELECT id FROM profiles LIMIT 1` | Eliminated — read from auth context |
| `GetProfile` use case | No input | Input: `{ profileId }` |
| `UpdateProfile` use case | Fetches single profile | Input: `{ profileId, ...fields }` |
| `GenerateResumePdf` use case | Fetches single profile | Input gains `profileId` |
| `ScoreJobFit` use case | Fetches single profile | Input gains `profileId` |
| `GenerationContextBuilder` | Fetches single profile internally | Takes `profileId` parameter |
| `CreateExperienceRoute` | Calls `getProfileId()` | Reads from auth context |
| `CreateEducationRoute` | Calls `getProfileId()` | Reads from auth context |
| `GetGenerationSettingsRoute` | Calls `getProfileId()` | Reads from auth context |
| `UpdateGenerationSettingsRoute` | Calls `getProfileId()` | Reads from auth context |
