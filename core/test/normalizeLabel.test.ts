import { describe, expect, test } from 'bun:test';
import { normalizeLabel } from '../src/normalizeLabel.js';

describe('normalizeLabel', () => {
  test('folds case', () => {
    expect(normalizeLabel('JavaScript')).toBe('javascript');
    expect(normalizeLabel('Javascript')).toBe('javascript');
    expect(normalizeLabel('TypeScript')).toBe('typescript');
    expect(normalizeLabel('gRPC')).toBe('grpc');
  });

  test('replaces spaces with hyphens', () => {
    expect(normalizeLabel('Node JS')).toBe('node-js');
    expect(normalizeLabel('Ruby on Rails')).toBe('ruby-on-rails');
    expect(normalizeLabel('Machine Learning')).toBe('machine-learning');
    expect(normalizeLabel('Team Building')).toBe('team-building');
  });

  test('collapses multiple spaces into single hyphen', () => {
    expect(normalizeLabel('  Programming   Languages  ')).toBe('programming-languages');
  });

  test('replaces runs of non-alphanumeric chars with single hyphen', () => {
    expect(normalizeLabel('Cloud & Infrastructure')).toBe('cloud-infrastructure');
    expect(normalizeLabel('DevOps & CI/CD')).toBe('devops-ci-cd');
    expect(normalizeLabel('AI & Machine Learning')).toBe('ai-machine-learning');
    expect(normalizeLabel('Leadership & Communication')).toBe('leadership-communication');
    expect(normalizeLabel('Testing & Quality')).toBe('testing-quality');
  });

  test('preserves hyphens between alphanumeric chars', () => {
    expect(normalizeLabel('scikit-learn')).toBe('scikit-learn');
    expect(normalizeLabel('T-SQL')).toBe('t-sql');
  });

  test('replaces dots with hyphens', () => {
    expect(normalizeLabel('Node.js')).toBe('node-js');
    expect(normalizeLabel('ASP.NET')).toBe('asp-net');
    expect(normalizeLabel('Vue.js')).toBe('vue-js');
  });

  test('trims leading/trailing hyphens after replacement', () => {
    expect(normalizeLabel('.NET')).toBe('net');
    expect(normalizeLabel('+++test+++')).toBe('test');
  });

  test('trims whitespace', () => {
    expect(normalizeLabel('  React  ')).toBe('react');
    expect(normalizeLabel('\tAngular\t')).toBe('angular');
  });

  test('handles empty string', () => {
    expect(normalizeLabel('')).toBe('');
    expect(normalizeLabel('   ')).toBe('');
  });

  test('handles strings with only non-alphanumeric chars', () => {
    expect(normalizeLabel('+++')).toBe('');
    expect(normalizeLabel('###')).toBe('');
    expect(normalizeLabel('...')).toBe('');
  });

  test('combines multiple rules', () => {
    expect(normalizeLabel('VueJS')).toBe('vuejs');
    expect(normalizeLabel('  scikit-learn  ')).toBe('scikit-learn');
    expect(normalizeLabel('Next.js Framework')).toBe('next-js-framework');
  });

  describe('C-family pre-normalization', () => {
    test('maps C to c-lang', () => {
      expect(normalizeLabel('C')).toBe('c-lang');
    });

    test('maps C++ to cpp', () => {
      expect(normalizeLabel('C++')).toBe('cpp');
    });

    test('maps C# to csharp', () => {
      expect(normalizeLabel('C#')).toBe('csharp');
    });

    test('maps F# to fsharp', () => {
      expect(normalizeLabel('F#')).toBe('fsharp');
    });

    test('maps Objective-C to objective-c', () => {
      expect(normalizeLabel('Objective-C')).toBe('objective-c');
    });

    test('maps Objective-C++ to objective-cpp', () => {
      expect(normalizeLabel('Objective-C++')).toBe('objective-cpp');
    });

    test('pre-normalization is case-sensitive', () => {
      expect(normalizeLabel('c')).toBe('c');
      expect(normalizeLabel('c++')).toBe('c');
      expect(normalizeLabel('c#')).toBe('c');
    });

    test('pre-normalization trims whitespace first', () => {
      expect(normalizeLabel('  C++  ')).toBe('cpp');
      expect(normalizeLabel(' C# ')).toBe('csharp');
    });

    test('does not match partial strings', () => {
      expect(normalizeLabel('C++ Builder')).toBe('c-builder');
      expect(normalizeLabel('Visual C#')).toBe('visual-c');
    });
  });
});
