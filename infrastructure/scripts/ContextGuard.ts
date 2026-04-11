import type { DevContext } from './DevContext.js';

export function requireMain(ctx: DevContext): void {
  if (ctx.mode !== 'main') {
    throw new Error('This command is for main branch only. In a worktree, use wt:<command> instead.');
  }
}

export function requireWorktree(ctx: DevContext): void {
  if (ctx.mode !== 'worktree') {
    throw new Error('This command is for worktrees only. On main, use dev:<command> instead.');
  }
}
