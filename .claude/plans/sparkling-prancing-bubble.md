# Remove per-experience bullet count caps from resume generation

## Context

Resume generation currently assigns tiered bullet limits based on experience position: 1st gets max 12, 2nd max 10, 3rd max 8, 4th max 6, 5th+ max 3. This artificially limits later experiences. The change removes these caps so every experience gets the same generous range, letting the LLM return as many bullets as the accomplishment data supports.

## Approach

Replace the tiered `BULLET_LIMITS` array + default with a single flat limit applied to all experiences: `{ min: 2, max: 20 }`. This touches the application layer (use cases) and the infrastructure layer (prompt + schema). The port interface stays the same — `minBullets`/`maxBullets` fields remain, just with uniform values.

## Files to modify

### 1. `/Users/sylvainestevez/Documents/Code Projects/TailoredIn/.claude/worktrees/sparkling-prancing-bubble/application/src/use-cases/resume/GenerateResumeContent.ts`
- Remove `BULLET_LIMITS` array (lines 17-22) and `BULLET_LIMITS_DEFAULT` (line 23)
- Replace with single constant: `const BULLET_LIMITS = { min: 2, max: 20 };`
- Update mapping (line 66): use the flat constant for all experiences

### 2. `/Users/sylvainestevez/Documents/Code Projects/TailoredIn/.claude/worktrees/sparkling-prancing-bubble/application/src/use-cases/resume/GenerateResumePdf.ts`
- Same change: replace tiered limits (lines 25-31) with flat `{ min: 2, max: 20 }`
- Update mapping (line 91)

### 3. `/Users/sylvainestevez/Documents/Code Projects/TailoredIn/.claude/worktrees/sparkling-prancing-bubble/infrastructure/src/services/prompts/generate-resume-bullets.md`
- Line 9: update bullet count rule to reflect that all experiences now use the same range

### 4. `/Users/sylvainestevez/Documents/Code Projects/TailoredIn/.claude/worktrees/sparkling-prancing-bubble/application/test/use-cases/resume/GenerateResumeContent.test.ts`
- Update tests at lines 224-296 that assert the tiered behavior — replace with assertions that all experiences get `{ min: 2, max: 20 }`

### 5. `/Users/sylvainestevez/Documents/Code Projects/TailoredIn/.claude/worktrees/sparkling-prancing-bubble/infrastructure/test/services/llm/GenerateResumeBulletsRequest.test.ts`
- Update `makeInput()` helper (lines 35-36, 45-46) to use `max: 20` instead of 12/10
- Update prompt assertion at line 204 to match new wording

## Verification

1. `bun test application/test/use-cases/resume/GenerateResumeContent.test.ts`
2. `bun test infrastructure/test/services/llm/GenerateResumeBulletsRequest.test.ts`
3. `bun run typecheck`
4. `bun run check`
