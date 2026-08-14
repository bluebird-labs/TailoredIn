import type Anthropic from '@anthropic-ai/sdk';
import type { ComposedPrompt } from '@tailoredin/application';
import { CacheTier } from '@tailoredin/domain';
import { z } from 'zod';
import type { ClaudeApiProvider } from '../../src/llm/ClaudeApiProvider.js';
import { ClaudeApiResumeElementGenerator } from '../../src/resume/ClaudeApiResumeElementGeneratorNew.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const BULLET_MAX = 220;

const outputSchema = z.object({
  summary: z.string().min(20).max(220),
  bullets: z.array(z.string().max(BULLET_MAX)).min(1)
});

const tooLongBullet = 'x'.repeat(254);
const validBullet = 'Led the migration of the payment platform to microservices, cutting checkout latency by 40%.';
const validSummary = 'Owned the payments platform end to end.';

function makePrompt(): ComposedPrompt {
  return {
    systemBlocks: [{ cacheTier: CacheTier.SYSTEM_STABLE, content: 'System rules' }],
    profileBlocks: [{ cacheTier: CacheTier.PROFILE_STABLE, content: 'Profile' }],
    sessionBlocks: [],
    requestBlocks: [{ cacheTier: CacheTier.REQUEST_VARIABLE, content: 'User Instructions: be blunt' }],
    model: 'claude-sonnet-4-6',
    outputSchema,
    meta: {
      scope: 'experience',
      profileId: 'profile-1234',
      jobDescriptionId: 'jd-1234',
      experienceId: 'exp-1234',
      generationRunId: 'run-1'
    }
  };
}

type ParseCall = { messages: Anthropic.Messages.MessageParam[] };

/** Builds a generator whose Anthropic client returns the given outputs, one per call. */
function makeGenerator(outputs: unknown[]): {
  generator: ClaudeApiResumeElementGenerator;
  calls: ParseCall[];
} {
  const calls: ParseCall[] = [];
  let index = 0;

  const client = {
    messages: {
      parse: async (params: ParseCall) => {
        calls.push(params);
        const output = outputs[Math.min(index, outputs.length - 1)];
        index += 1;
        return { parsed_output: output };
      }
    }
  } as unknown as Anthropic;

  const provider = { getClient: () => client } as unknown as ClaudeApiProvider;
  return { generator: new ClaudeApiResumeElementGenerator(provider), calls };
}

function lastUserText(call: ParseCall): string {
  const content = call.messages[call.messages.length - 1].content;
  if (typeof content === 'string') return content;
  return content.map(block => (block.type === 'text' ? block.text : '')).join('\n');
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClaudeApiResumeElementGenerator', () => {
  test('returns the parsed data without a retry when the first response validates', async () => {
    const { generator, calls } = makeGenerator([{ summary: validSummary, bullets: [validBullet] }]);

    const result = await generator.generate(makePrompt());

    expect(result).toEqual({ summary: validSummary, bullets: [validBullet] });
    expect(calls).toHaveLength(1);
  });

  test('retries once with the violations and returns the repaired data', async () => {
    const { generator, calls } = makeGenerator([
      { summary: validSummary, bullets: [tooLongBullet] },
      { summary: validSummary, bullets: [validBullet] }
    ]);

    const result = await generator.generate(makePrompt());

    expect(result).toEqual({ summary: validSummary, bullets: [validBullet] });
    expect(calls).toHaveLength(2);
  });

  test('repair message names the violated field, the actual value and the hard limit', async () => {
    const { generator, calls } = makeGenerator([
      { summary: validSummary, bullets: [tooLongBullet] },
      { summary: validSummary, bullets: [validBullet] }
    ]);

    await generator.generate(makePrompt());

    const repairText = lastUserText(calls[1]);
    expect(repairText).toContain('bullets.0');
    expect(repairText).toContain('254 characters');
    expect(repairText).toContain(`at most ${BULLET_MAX} characters`);
    expect(repairText).toContain('Rejected response:');
    expect(repairText).toContain(tooLongBullet);
  });

  test('repair retry preserves the original messages and appends the correction', async () => {
    const { generator, calls } = makeGenerator([
      { summary: validSummary, bullets: [tooLongBullet] },
      { summary: validSummary, bullets: [validBullet] }
    ]);

    await generator.generate(makePrompt());

    expect(calls[1].messages).toHaveLength(calls[0].messages.length + 1);
    expect(calls[1].messages.slice(0, calls[0].messages.length)).toEqual(calls[0].messages);
    expect(calls[1].messages[calls[1].messages.length - 1].role).toBe('user');
  });

  test('throws after a failed repair retry and does not call the model a third time', async () => {
    const { generator, calls } = makeGenerator([
      { summary: validSummary, bullets: [tooLongBullet] },
      { summary: validSummary, bullets: [tooLongBullet] }
    ]);

    await expect(generator.generate(makePrompt())).rejects.toThrow(/Schema validation failed after repair retry/);
    expect(calls).toHaveLength(2);
  });

  test('surfaces API failures without attempting a repair retry', async () => {
    const provider = {
      getClient: () =>
        ({
          messages: {
            parse: async () => {
              throw new Error('boom');
            }
          }
        }) as unknown as Anthropic
    } as unknown as ClaudeApiProvider;

    const generator = new ClaudeApiResumeElementGenerator(provider);

    await expect(generator.generate(makePrompt())).rejects.toThrow(/boom/);
  });
});
