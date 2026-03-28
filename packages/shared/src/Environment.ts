import { z } from 'zod';
import { NodeEnv } from './NodeEnv.js';
import { EnumUtil } from './EnumUtil.js';
import * as NpmLog from 'npmlog';

const LOG_PREFIX = 'Environment';

const zBool = () => z.enum(['true', 'false']).transform(v => v === 'true');

const EnvSchema = z.strictObject({
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

export namespace Environment {
  let nodeEnv: string | undefined | NodeEnv = process.env.NODE_ENV;

  if (!nodeEnv) {
    NpmLog.warn(LOG_PREFIX, `NODE_ENV is not set. Defaulting to ${NodeEnv.DEV}.`);
    nodeEnv = NodeEnv.DEV;
  }

  if (!nodeEnv || !EnumUtil.is(nodeEnv, NodeEnv)) {
    throw new Error(`NODE_ENV must be set to one of ${EnumUtil.values(NodeEnv).join(', ')}`);
  }

  // Env vars are populated by `import 'dotenv/config'` in each process entry point.
  const env: Env = EnvSchema.parse(process.env);

  export const get = <K extends keyof Env>(key: K): Env[K] => {
    return env[key];
  };

  export const NODE_ENV = nodeEnv;
}
