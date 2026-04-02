import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { ClaudeCliLlmProvider, type CommandRunner } from '../../../src/services/structured-llm/ClaudeCliLlmProvider.js';

const inputSchema = z.object({ topic: z.string() });
const outputSchema = z.object({ summary: z.string(), score: z.number() });

function createProvider(stdout: string, stderr = ''): ClaudeCliLlmProvider {
  const runner: CommandRunner = async () => ({ stdout, stderr });
  return new ClaudeCliLlmProvider(runner);
}

function createFailingProvider(errorMessage: string, exitCode = 1): ClaudeCliLlmProvider {
  const runner: CommandRunner = async () => {
    throw new Error(`Claude CLI failed (exit ${exitCode}): ${errorMessage}`);
  };
  return new ClaudeCliLlmProvider(runner);
}

describe('ClaudeCliLlmProvider', () => {
  it('parses valid JSON response from Claude CLI', async () => {
    const provider = createProvider(JSON.stringify({ result: '{"summary":"test summary","score":42}' }));

    const result = await provider.generate({
      prompt: 'Summarize this topic',
      inputSchema,
      outputSchema,
      context: { topic: 'AI' }
    });

    expect(result).toEqual({ summary: 'test summary', score: 42 });
  });

  it('handles JSON wrapped in markdown fences', async () => {
    const provider = createProvider(JSON.stringify({ result: '```json\n{"summary":"fenced","score":7}\n```' }));

    const result = await provider.generate({
      prompt: 'test',
      inputSchema,
      outputSchema,
      context: { topic: 'test' }
    });

    expect(result).toEqual({ summary: 'fenced', score: 7 });
  });

  it('throws on non-zero exit code', async () => {
    const provider = createFailingProvider('error message');

    await expect(
      provider.generate({
        prompt: 'test',
        inputSchema,
        outputSchema,
        context: { topic: 'test' }
      })
    ).rejects.toThrow('Claude CLI failed (exit 1)');
  });

  it('throws on Zod validation failure', async () => {
    const provider = createProvider(JSON.stringify({ result: '{"summary":123,"score":"not a number"}' }));

    await expect(
      provider.generate({
        prompt: 'test',
        inputSchema,
        outputSchema,
        context: { topic: 'test' }
      })
    ).rejects.toThrow();
  });

  it('handles direct JSON object response (no result wrapper)', async () => {
    const provider = createProvider(JSON.stringify({ summary: 'direct', score: 5 }));

    const result = await provider.generate({
      prompt: 'test',
      inputSchema,
      outputSchema,
      context: { topic: 'test' }
    });

    expect(result).toEqual({ summary: 'direct', score: 5 });
  });
});
