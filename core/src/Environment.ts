/**
 * Typed access to process.env. Bun loads .env natively — no dotenv needed.
 * Throws at call time (not import time) if a requested key is missing.
 */
export function env(key: string): string {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function envInt(key: string): number {
  const raw = env(key);
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) {
    throw new Error(`Environment variable ${key} must be an integer, got: ${raw}`);
  }
  return n;
}

export function envOptional(key: string): string | undefined {
  return process.env[key];
}

export function envBool(key: string): boolean {
  return env(key) === 'true';
}
