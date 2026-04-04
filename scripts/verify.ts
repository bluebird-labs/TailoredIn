/**
 * Full project verification script.
 * Runs all checks sequentially, stopping on first failure.
 *
 * Usage: bun run scripts/verify.ts
 */

const steps = [
	{ name: "typecheck", cmd: ["bun", "run", "typecheck"] },
	{ name: "check (Biome lint + format)", cmd: ["bun", "run", "check"] },
	{ name: "dep:check (architecture boundaries)", cmd: ["bun", "run", "dep:check"] },
	{ name: "knip (dead code)", cmd: ["bun", "run", "knip"] },
	{ name: "test:coverage (unit tests)", cmd: ["bun", "run", "test:coverage"] },
	{ name: "test:integration (Testcontainers)", cmd: ["bun", "run", "--cwd", "infrastructure", "test:integration"] },
	{ name: "test:e2e (Playwright)", cmd: ["bun", "run", "test:e2e"] },
];

const total = steps.length;
const totalStart = performance.now();

for (let i = 0; i < total; i++) {
	const step = steps[i];
	const stepNum = i + 1;

	console.log(`\n${"─".repeat(60)}`);
	console.log(`Step ${stepNum}/${total}: ${step.name}`);
	console.log("─".repeat(60));

	const stepStart = performance.now();
	const proc = Bun.spawn(step.cmd, {
		stdout: "inherit",
		stderr: "inherit",
		cwd: import.meta.dir + "/..",
	});

	const exitCode = await proc.exited;
	const elapsed = ((performance.now() - stepStart) / 1000).toFixed(1);

	if (exitCode !== 0) {
		console.error(`\n✗ Step ${stepNum}/${total} failed: ${step.name} (${elapsed}s)`);
		process.exit(exitCode);
	}

	console.log(`✓ ${step.name} (${elapsed}s)`);
}

const totalElapsed = ((performance.now() - totalStart) / 1000).toFixed(1);
console.log(`\n${"─".repeat(60)}`);
console.log(`✓ All ${total} steps passed (${totalElapsed}s)`);
console.log("─".repeat(60));
