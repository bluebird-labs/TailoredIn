import { z } from 'zod';
import { EnumUtil } from './EnumUtil.js';
import { Logger } from './Logger.js';
import { NodeEnv } from './NodeEnv.js';

const zBool = () => z.enum(['true', 'false']).transform(v => v === 'true');

const EnvSchema = z.object({
  TZ: z.string(),

  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_SCHEMA: z.string(),

  LINKEDIN_EMAIL: z.string().email(),
  LINKEDIN_PASSWORD: z.string(),

  HEADLESS: zBool(),
  SLOW_MO: z.coerce.number().int().min(0),

  OPENAI_API_KEY: z.string(),
  OPENAI_PROJECT_ID: z.string()
});

type Env = z.infer<typeof EnvSchema>;

// Lazy initialization — env is parsed on first access, not at module evaluation time.
// Bun loads .env natively, but the MikroORM CLI may import this module before all
// env vars are available. Deferring avoids validation errors during module evaluation.
let env: Env | null = null;

function getEnv(): Env {
  if (!env) {
    env = EnvSchema.parse(process.env);
  }
  return env;
}

export namespace Environment {
  let nodeEnv: string | undefined | NodeEnv = process.env.NODE_ENV;

  if (!nodeEnv) {
    Logger.create('Environment').warn(`NODE_ENV is not set. Defaulting to ${NodeEnv.DEV}.`);
    nodeEnv = NodeEnv.DEV;
  }

  if (!nodeEnv || !EnumUtil.is(nodeEnv, NodeEnv)) {
    throw new Error(`NODE_ENV must be set to one of ${EnumUtil.values(NodeEnv).join(', ')}`);
  }

  export const get = <K extends keyof Env>(key: K): Env[K] => {
    return getEnv()[key];
  };

  export const NODE_ENV = nodeEnv;
}
