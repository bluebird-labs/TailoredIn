import { GenerationPrompt } from '../../src/entities/GenerationPrompt.js';
import { GenerationSettings } from '../../src/entities/GenerationSettings.js';
import { GenerationScope } from '../../src/value-objects/GenerationScope.js';
import { ModelTier } from '../../src/value-objects/ModelTier.js';

describe('GenerationSettings', () => {
  describe('createDefault', () => {
    test('creates settings with Balanced tier and default bullet range', () => {
      const settings = GenerationSettings.createDefault('profile-1');

      expect(settings.profileId).toBe('profile-1');
      expect(settings.modelTier).toBe(ModelTier.BALANCED);
      expect(settings.bulletMin).toBe(2);
      expect(settings.bulletMax).toBe(5);
      expect(settings.prompts).toHaveLength(0);
      expect(settings.id).toBeDefined();
      expect(settings.createdAt).toBeInstanceOf(Date);
      expect(settings.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateModelTier', () => {
    test('changes tier and updates timestamp', () => {
      const settings = GenerationSettings.createDefault('profile-1');
      const before = settings.updatedAt;

      settings.updateModelTier(ModelTier.BEST);

      expect(settings.modelTier).toBe(ModelTier.BEST);
      expect(settings.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('updateBulletRange', () => {
    test('updates min and max', () => {
      const settings = GenerationSettings.createDefault('profile-1');

      settings.updateBulletRange(3, 8);

      expect(settings.bulletMin).toBe(3);
      expect(settings.bulletMax).toBe(8);
    });

    test('throws when min is 0', () => {
      const settings = GenerationSettings.createDefault('profile-1');
      expect(() => settings.updateBulletRange(0, 5)).toThrow('bulletMin must be greater than 0');
    });

    test('throws when min is negative', () => {
      const settings = GenerationSettings.createDefault('profile-1');
      expect(() => settings.updateBulletRange(-1, 5)).toThrow('bulletMin must be greater than 0');
    });

    test('throws when max is less than min', () => {
      const settings = GenerationSettings.createDefault('profile-1');
      expect(() => settings.updateBulletRange(5, 3)).toThrow('bulletMax must be greater than or equal to bulletMin');
    });

    test('allows min equal to max', () => {
      const settings = GenerationSettings.createDefault('profile-1');
      settings.updateBulletRange(4, 4);
      expect(settings.bulletMin).toBe(4);
      expect(settings.bulletMax).toBe(4);
    });
  });

  describe('setPrompt', () => {
    test('adds a new prompt for a scope', () => {
      const settings = GenerationSettings.createDefault('profile-1');

      settings.setPrompt(GenerationScope.RESUME, 'Always use past tense');

      expect(settings.prompts).toHaveLength(1);
      expect(settings.prompts[0].scope).toBe(GenerationScope.RESUME);
      expect(settings.prompts[0].content).toBe('Always use past tense');
    });

    test('updates existing prompt for the same scope', () => {
      const settings = GenerationSettings.createDefault('profile-1');

      settings.setPrompt(GenerationScope.RESUME, 'Version 1');
      settings.setPrompt(GenerationScope.RESUME, 'Version 2');

      expect(settings.prompts).toHaveLength(1);
      expect(settings.prompts[0].content).toBe('Version 2');
    });

    test('can set prompts for different scopes', () => {
      const settings = GenerationSettings.createDefault('profile-1');

      settings.setPrompt(GenerationScope.RESUME, 'Resume prompt');
      settings.setPrompt(GenerationScope.HEADLINE, 'Headline prompt');
      settings.setPrompt(GenerationScope.EXPERIENCE, 'Experience prompt');

      expect(settings.prompts).toHaveLength(3);
    });
  });

  describe('removePrompt', () => {
    test('removes an existing prompt', () => {
      const settings = GenerationSettings.createDefault('profile-1');
      settings.setPrompt(GenerationScope.RESUME, 'Test');

      settings.removePrompt(GenerationScope.RESUME);

      expect(settings.prompts).toHaveLength(0);
    });

    test('does nothing when removing a non-existent prompt', () => {
      const settings = GenerationSettings.createDefault('profile-1');
      const before = settings.updatedAt;

      settings.removePrompt(GenerationScope.HEADLINE);

      expect(settings.prompts).toHaveLength(0);
      expect(settings.updatedAt).toBe(before);
    });
  });

  describe('getPrompt', () => {
    test('returns content for an existing prompt', () => {
      const settings = GenerationSettings.createDefault('profile-1');
      settings.setPrompt(GenerationScope.RESUME, 'My prompt');

      expect(settings.getPrompt(GenerationScope.RESUME)).toBe('My prompt');
    });

    test('returns null for a non-existent prompt', () => {
      const settings = GenerationSettings.createDefault('profile-1');

      expect(settings.getPrompt(GenerationScope.HEADLINE)).toBeNull();
    });
  });
});

describe('GenerationPrompt', () => {
  test('create sets fields and timestamps', () => {
    const prompt = GenerationPrompt.create({
      generationSettingsId: crypto.randomUUID(),
      scope: GenerationScope.RESUME,
      content: 'Use active voice'
    });

    expect(prompt.scope).toBe(GenerationScope.RESUME);
    expect(prompt.content).toBe('Use active voice');
    expect(prompt.id).toBeDefined();
    expect(prompt.createdAt).toBeInstanceOf(Date);
  });

  test('updateContent changes content and updatedAt', () => {
    const prompt = new GenerationPrompt({
      id: crypto.randomUUID(),
      generationSettingsId: crypto.randomUUID(),
      scope: GenerationScope.HEADLINE,
      content: 'Original',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    });

    prompt.updateContent('Updated');

    expect(prompt.content).toBe('Updated');
    expect(prompt.updatedAt.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime());
  });
});
