import { z } from 'zod';

export const EnvSchema = z.object({
  APP_PROFILE: z.enum(['local', 'production', 'test']).default('local'),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_SCHEMA: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(8000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive(),
  CLAUDE_API_KEY: z.string().optional(),
  TZ: z.string().default('UTC')
});

type _Env = z.infer<typeof EnvSchema>;
