import { describe, expect, test } from 'bun:test';
import { BulletVariant } from '../../src/entities/BulletVariant.js';
import { ApprovalStatus } from '../../src/value-objects/ApprovalStatus.js';
import { TagSet } from '../../src/value-objects/TagSet.js';

describe('BulletVariant', () => {
  test('creates with pending approval status for llm source', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'Led migration of 3 services to Kubernetes',
      angle: 'leadership',
      tags: new TagSet({ roleTags: ['leadership'], skillTags: ['kubernetes'] }),
      source: 'llm'
    });
    expect(variant.text).toBe('Led migration of 3 services to Kubernetes');
    expect(variant.angle).toBe('leadership');
    expect(variant.approvalStatus).toBe(ApprovalStatus.PENDING);
    expect(variant.tags.roleTags).toEqual(['leadership']);
    expect(variant.tags.skillTags).toEqual(['kubernetes']);
    expect(variant.source).toBe('llm');
  });

  test('manual source starts approved', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'manual'
    });
    expect(variant.approvalStatus).toBe(ApprovalStatus.APPROVED);
  });

  test('can be approved', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'llm'
    });
    variant.approve();
    expect(variant.approvalStatus).toBe(ApprovalStatus.APPROVED);
  });

  test('can be rejected', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'llm'
    });
    variant.reject();
    expect(variant.approvalStatus).toBe(ApprovalStatus.REJECTED);
  });

  test('updates text and angle', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'original',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'manual'
    });
    variant.text = 'updated';
    variant.angle = 'leadership';
    expect(variant.text).toBe('updated');
    expect(variant.angle).toBe('leadership');
  });

  test('updates tags', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'manual'
    });
    const newTags = new TagSet({ roleTags: ['leadership'], skillTags: ['react'] });
    variant.tags = newTags;
    expect(variant.tags.roleTags).toEqual(['leadership']);
    expect(variant.tags.skillTags).toEqual(['react']);
  });
});
