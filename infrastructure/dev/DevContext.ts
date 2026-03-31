import { basename, dirname, resolve } from 'node:path';

export type DevMode = 'main' | 'worktree';

export interface DevContext {
  mode: DevMode;
  /** Absolute path to the main repo root (even when inside a worktree). */
  repoRoot: string;
  /** Current working directory. */
  workingDir: string;
  /** Worktree directory name (e.g. "milestone-5"), null on main. */
  worktreeName: string | null;
  /** Docker Compose project name. */
  projectName: string;
  /** Absolute path to compose.yaml (always at repo root). */
  composeFile: string;
  /** Directory docker compose uses for resolving relative paths. */
  composeProjectDir: string;
  /** Container name for the postgres service. */
  containerName: string;
}

export function resolveDevContext(): DevContext {
  const workingDir = resolve('.');

  const gitCommonResult = Bun.spawnSync(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir']);
  const gitCommon = gitCommonResult.stdout.toString().trim();
  if (!gitCommon || gitCommonResult.exitCode !== 0) {
    throw new Error('Not inside a git repository.');
  }

  const repoRoot = dirname(gitCommon);
  const isWorktree = workingDir.includes('.claude/worktrees/');
  const worktreeName = isWorktree ? basename(workingDir) : null;

  const mode: DevMode = isWorktree ? 'worktree' : 'main';
  const projectName = isWorktree ? `tailoredin-${worktreeName}` : 'tailored-in';
  const composeFile = resolve(repoRoot, 'compose.yaml');
  const composeProjectDir = isWorktree ? workingDir : repoRoot;
  const containerName = `${projectName}-postgres-1`;

  return {
    mode,
    repoRoot,
    workingDir,
    worktreeName,
    projectName,
    composeFile,
    composeProjectDir,
    containerName
  };
}
