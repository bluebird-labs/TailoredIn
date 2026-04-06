// infrastructure/test/services/TypstResumeRendererFactory.test.ts
import { describe, expect, test } from 'bun:test';
import { TypstResumeRendererFactory } from '../../src/services/TypstResumeRendererFactory.js';
import { BrilliantCvRenderer } from '../../src/services/renderers/BrilliantCvRenderer.js';
import { ImprecvRenderer } from '../../src/services/renderers/ImprecvRenderer.js';
import { ModernCvRenderer } from '../../src/services/renderers/ModernCvRenderer.js';
import { LinkedCvRenderer } from '../../src/services/renderers/LinkedCvRenderer.js';

describe('TypstResumeRendererFactory', () => {
  const factory = new TypstResumeRendererFactory();

  test('returns BrilliantCvRenderer for "brilliant-cv"', () => {
    expect(factory.get('brilliant-cv')).toBeInstanceOf(BrilliantCvRenderer);
  });

  test('returns ImprecvRenderer for "imprecv"', () => {
    expect(factory.get('imprecv')).toBeInstanceOf(ImprecvRenderer);
  });

  test('returns ModernCvRenderer for "modern-cv"', () => {
    expect(factory.get('modern-cv')).toBeInstanceOf(ModernCvRenderer);
  });

  test('returns LinkedCvRenderer for "linked-cv"', () => {
    expect(factory.get('linked-cv')).toBeInstanceOf(LinkedCvRenderer);
  });

  test('returns the same instance on repeated calls (singleton per theme)', () => {
    expect(factory.get('imprecv')).toBe(factory.get('imprecv'));
  });
});
