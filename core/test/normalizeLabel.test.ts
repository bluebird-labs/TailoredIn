import { describe, expect, test } from 'bun:test';
import { normalizeLabel } from '../src/normalizeLabel.js';

describe('normalizeLabel', () => {
  test('folds case', () => {
    expect(normalizeLabel('JavaScript')).toBe('javascript');
    expect(normalizeLabel('Javascript')).toBe('javascript');
    expect(normalizeLabel('gRPC')).toBe('grpc');
  });

  test('strips spaces', () => {
    expect(normalizeLabel('Node JS')).toBe('nodejs');
    expect(normalizeLabel('Ruby on Rails')).toBe('rubyonrails');
    expect(normalizeLabel('Machine Learning')).toBe('machinelearning');
    expect(normalizeLabel('Team Building')).toBe('teambuilding');
  });

  test('strips hyphens/dashes', () => {
    expect(normalizeLabel('scikit-learn')).toBe('scikitlearn');
    expect(normalizeLabel('T-SQL')).toBe('tsql');
  });

  test('strips underscores', () => {
    expect(normalizeLabel('some_label')).toBe('somelabel');
  });

  test('preserves dots', () => {
    expect(normalizeLabel('Node.js')).toBe('node.js');
    expect(normalizeLabel('ASP.NET')).toBe('asp.net');
    expect(normalizeLabel('.NET')).toBe('.net');
    expect(normalizeLabel('Vue.js')).toBe('vue.js');
  });

  test('preserves +, #, /, @, &', () => {
    expect(normalizeLabel('C++')).toBe('c++');
    expect(normalizeLabel('C#')).toBe('c#');
    expect(normalizeLabel('CI/CD')).toBe('ci/cd');
  });

  test('trims whitespace', () => {
    expect(normalizeLabel('  React  ')).toBe('react');
    expect(normalizeLabel('\tAngular\t')).toBe('angular');
  });

  test('handles empty string', () => {
    expect(normalizeLabel('')).toBe('');
  });

  test('handles special chars only', () => {
    expect(normalizeLabel('+++')).toBe('+++');
    expect(normalizeLabel('###')).toBe('###');
  });

  test('combines multiple rules', () => {
    expect(normalizeLabel('VueJS')).toBe('vuejs');
    expect(normalizeLabel('  scikit-learn  ')).toBe('scikitlearn');
  });
});
