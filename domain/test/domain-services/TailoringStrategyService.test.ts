import { describe, expect, it } from 'bun:test';
import { TailoringStrategyService } from '../../src/domain-services/TailoringStrategyService.js';
import { ArchetypeKey } from '../../src/value-objects/Archetype.js';
import { TemplateStyle } from '../../src/value-objects/TemplateStyle.js';

describe('TailoringStrategyService', () => {
  const service = new TailoringStrategyService();

  describe('resolveTemplateStyle', () => {
    it.each([
      [ArchetypeKey.IC, TemplateStyle.IC],
      [ArchetypeKey.LEAD_IC, TemplateStyle.IC],
      [ArchetypeKey.NERD, TemplateStyle.IC]
    ])('maps %s to IC', (archetype, expected) => {
      expect(service.resolveTemplateStyle(archetype)).toBe(expected);
    });

    it('maps HAND_ON_MANAGER to ARCHITECT', () => {
      expect(service.resolveTemplateStyle(ArchetypeKey.HAND_ON_MANAGER)).toBe(TemplateStyle.ARCHITECT);
    });

    it('maps LEADER_MANAGER to EXECUTIVE', () => {
      expect(service.resolveTemplateStyle(ArchetypeKey.LEADER_MANAGER)).toBe(TemplateStyle.EXECUTIVE);
    });
  });
});
