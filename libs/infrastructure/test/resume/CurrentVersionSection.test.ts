import { CacheTier, type GenerationContext, ModelTier } from '@tailoredin/domain';
import { CurrentVersionSection } from '../../src/resume/prompt-sections/CurrentVersionSection.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<GenerationContext> = {}): GenerationContext {
  return {
    profile: { id: 'p1', firstName: 'Ada', lastName: 'Lovelace', about: null, location: null },
    jobDescription: {
      id: 'jd1',
      title: 'Staff Engineer',
      description: 'Build things',
      rawText: null,
      soughtHardSkills: [],
      soughtSoftSkills: [],
      level: null
    },
    experiences: [],
    companies: [],
    education: [],
    settings: { modelTier: ModelTier.BALANCED, bulletMin: 3, bulletMax: 5, adminPrompts: new Map() },
    userInstructions: null,
    currentVersion: null,
    ...overrides
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CurrentVersionSection', () => {
  const section = new CurrentVersionSection();

  test('is a request-variable section named current-version', () => {
    expect(section.name).toBe('current-version');
    expect(section.cacheTier).toBe(CacheTier.REQUEST_VARIABLE);
  });

  test('renders empty content when currentVersion is absent', () => {
    const block = section.render(makeContext());

    expect(block.content).toBe('');
    expect(block.cacheTier).toBe(CacheTier.REQUEST_VARIABLE);
  });

  test('renders empty content when currentVersion is an empty string', () => {
    const block = section.render(makeContext({ currentVersion: '' }));

    expect(block.content).toBe('');
  });

  test('includes the previous draft text when currentVersion is present', () => {
    const block = section.render(makeContext({ currentVersion: 'Shipped the thing on time.' }));

    expect(block.content).toContain('Shipped the thing on time.');
    expect(block.cacheTier).toBe(CacheTier.REQUEST_VARIABLE);
  });

  test('frames the draft as revisable material rather than a target to reproduce', () => {
    const block = section.render(makeContext({ currentVersion: 'Previous bullet text.' }));

    expect(block.content).toContain('previous draft');
    expect(block.content).toContain('NOT a target to reproduce');
    expect(block.content).toContain('must not be preserved by default');
  });

  test('subordinates the draft to the user instructions', () => {
    const block = section.render(makeContext({ currentVersion: 'Previous bullet text.' }));

    expect(block.content).toContain('the user instructions win');
  });
});
