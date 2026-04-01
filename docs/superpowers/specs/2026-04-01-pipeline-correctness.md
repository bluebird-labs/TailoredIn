# Spec: Pipeline Correctness — bulletVariantIds Must Drive Resume Output

**Date:** 2026-04-01
**Status:** Draft

## 1. Problem Statement

`DatabaseResumeContentFactory.make()` (lines 57-74) iterates over `cs.experienceSelections` and correctly looks up each `Experience` by ID. However, when building the `highlights` array for each experience entry, it ignores `sel.bulletVariantIds` entirely. Instead it sorts all bullets by ordinal and uses `bullet.content` (the original bullet text) as highlights.

The `ExperienceSelection` type carries `bulletVariantIds: string[]` — these are IDs of specific `BulletVariant` entities the user chose for this archetype. The factory should resolve those variant IDs to `BulletVariant.text` values and use those as highlights.

## 2. Current Broken Code (lines 57-74)

```typescript
const experience = cs.experienceSelections.map(sel => {
  const exp = experienceMap.get(sel.experienceId);
  if (!exp) throw new Error(`Experience not found: ${sel.experienceId}`);

  const sortedBullets = [...exp.bullets].sort((a, b) => a.ordinal - b.ordinal);
  const highlights = sortedBullets.map(b => StringUtil.ensureEndsWith(b.content, '.'));
  // ...
});
```

Problems:
- Uses `exp.bullets` (all bullets) instead of the selected variant IDs from `sel.bulletVariantIds`
- Uses `b.content` (the original bullet text) instead of `BulletVariant.text` (the tailored variant text)

## 3. Required Changes

### 3.1 Build a variant lookup index

Before mapping experience selections, build a `Map<string, { text: string; bulletOrdinal: number }>` keyed by variant ID across all loaded experiences:

```typescript
const variantMap = new Map<string, { text: string; bulletOrdinal: number }>();
for (const exp of allExperiences) {
  for (const bullet of exp.bullets) {
    for (const variant of bullet.variants) {
      variantMap.set(variant.id.value, {
        text: variant.text,
        bulletOrdinal: bullet.ordinal
      });
    }
  }
}
```

### 3.2 Replace the highlights-building logic

```typescript
const experience = cs.experienceSelections.map(sel => {
  const exp = experienceMap.get(sel.experienceId);
  if (!exp) {
    throw new Error(`Experience not found: ${sel.experienceId}`);
  }

  const highlights: string[] = [];
  for (const variantId of sel.bulletVariantIds) {
    const entry = variantMap.get(variantId);
    if (!entry) {
      // Variant was deleted after archetype was configured — skip gracefully
      continue;
    }
    highlights.push(StringUtil.ensureEndsWith(entry.text, '.'));
  }

  return {
    title: exp.title,
    society: exp.companyName,
    date: formatDateRange(exp.startDate, exp.endDate),
    location: exp.location,
    summary: exp.summary ?? '',
    highlights
  };
});
```

### 3.3 No changes required to the repository layer

`PostgresExperienceRepository.toDomain()` already loads all bullet variants eagerly when building `Experience` objects. The `findAll()` call in the factory already returns fully-hydrated experiences with bullets and variants. No repository changes are needed.

### 3.4 No changes required to the DTO or downstream consumer

`ResumeExperienceDto.highlights` is `string[]`. The Typst generator iterates `exp.highlights` unchanged. The shape is preserved.

## 4. Ordering Strategy

**Use selection order** — the order of IDs in `sel.bulletVariantIds` is the order highlights appear in the resume. This is the most intuitive behavior: the user or the archetype-building UI determines the order by placing variant IDs in a specific sequence. The factory preserves that sequence.

Rationale: The user explicitly curated this list. Resorting by bullet ordinal would discard any intentional reordering.

## 5. Edge Cases

| Scenario | Behavior |
|---|---|
| **Selected variantId does not exist** (deleted variant) | Skip it, log a warning. Do not throw — a deleted variant should not block resume generation. |
| **Experience selected but `bulletVariantIds` is empty** | `highlights` will be an empty array. The experience still appears (title, company, dates, summary) but with no bullet points. This is valid. |
| **Variant exists but has `approvalStatus !== APPROVED`** | Include it. The user explicitly selected this variant ID. Approval status is an editorial workflow signal, not a generation-time gate. |
| **Variant belongs to a bullet in a different experience** | Data integrity issue the UI prevents. The variant will still be found in the global `variantMap`. Defer a cross-experience guard unless it becomes a real problem. |

## 6. Testing Strategy

### 6.1 Test file location

`infrastructure/test/services/DatabaseResumeContentFactory.test.ts`

### 6.2 Test setup

All six repository dependencies are interfaces. Create simple in-memory stubs. The factory is pure data transformation.

### 6.3 Test cases

1. **Happy path: variants drive highlights** — Create an experience with 2 bullets, each with 2 variants. Set `bulletVariantIds` to pick one variant from each bullet. Assert highlights contain exactly those 2 variant texts (with trailing period), in selection order.
2. **Selection order is preserved** — Set `bulletVariantIds = [variant2Id, variant1Id]`. Assert highlights[0] is variant2's text.
3. **Missing variant is skipped** — Include a non-existent UUID in `bulletVariantIds`. Assert it is silently excluded.
4. **Empty bulletVariantIds** — Assert highlights is an empty array but the experience entry still exists in output.
5. **Multiple experiences with different selections** — Two experiences, each with different variant selections. Assert each has correct highlights.
6. **Variant text gets trailing period** — Text without a period gets one appended. Text already ending with a period does not get doubled.

## 7. Migration / Backwards Compatibility

No schema changes. No API changes. The `ContentSelection` value object and its persistence are already correct. This is purely a fix to how the factory consumes the already-correct data.

Archetypes created before variants existed may have `bulletVariantIds: []`. With this fix, those archetypes will produce experiences with empty highlights. A one-time data migration could populate `bulletVariantIds` with default variants — out of scope for this fix but worth noting.

## 8. Files to Modify

| File | Change |
|---|---|
| `infrastructure/src/services/DatabaseResumeContentFactory.ts` | Replace lines 55-74 with variant-aware logic |
| `infrastructure/test/services/DatabaseResumeContentFactory.test.ts` | New file — unit tests |
