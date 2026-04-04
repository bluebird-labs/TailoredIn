#!/usr/bin/env bun
/**
 * Tiny guard script for package.json chaining.
 * Exits 0 if on main, exits 1 with error message if in a worktree.
 */
import { requireMain } from './ContextGuard.js';
import { resolveDevContext } from './DevContext.js';

try {
  requireMain(resolveDevContext());
} catch (e) {
  // biome-ignore lint/suspicious/noConsole: CLI script needs stderr output
  console.error((e as Error).message);
  process.exit(1);
}
