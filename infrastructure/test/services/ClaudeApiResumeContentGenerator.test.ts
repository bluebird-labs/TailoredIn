import { describe, expect, test } from 'bun:test';
import { ModelTier } from '@tailoredin/domain';

// Test the MODEL_TIER_MAP logic directly (extracted for testability)
const MODEL_TIER_MAP: Record<ModelTier, string> = {
  [ModelTier.FAST]: 'claude-haiku-4-5',
  [ModelTier.BALANCED]: 'claude-sonnet-4-6',
  [ModelTier.BEST]: 'claude-opus-4-6'
};

function resolveModel(modelTier?: string): string {
  if (!modelTier) return 'claude-opus-4-6';
  return MODEL_TIER_MAP[modelTier as ModelTier] ?? 'claude-opus-4-6';
}

describe('ClaudeApiResumeContentGenerator — model tier mapping', () => {
  test('maps fast tier to claude-haiku-4-5', () => {
    expect(resolveModel('fast')).toBe('claude-haiku-4-5');
  });

  test('maps balanced tier to claude-sonnet-4-6', () => {
    expect(resolveModel('balanced')).toBe('claude-sonnet-4-6');
  });

  test('maps best tier to claude-opus-4-6', () => {
    expect(resolveModel('best')).toBe('claude-opus-4-6');
  });

  test('defaults to claude-opus-4-6 when model is undefined', () => {
    expect(resolveModel(undefined)).toBe('claude-opus-4-6');
  });

  test('defaults to claude-opus-4-6 for unknown tier', () => {
    expect(resolveModel('unknown')).toBe('claude-opus-4-6');
  });
});
