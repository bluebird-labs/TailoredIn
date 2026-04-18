import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EscoCsvParseError } from '../../src/esco/EscoCsvParseError.js';
import { EscoCsvParser } from '../../src/esco/EscoCsvParser.js';
import { BroaderRelationOccPillarSchema } from '../../src/esco/schemas/broader-relation-occ-pillar.js';
import { BroaderRelationSkillPillarSchema } from '../../src/esco/schemas/broader-relation-skill-pillar.js';
import { ConceptSchemeSchema } from '../../src/esco/schemas/concept-scheme.js';
import { DictionarySchema } from '../../src/esco/schemas/dictionary.js';
import { GreenShareOccupationSchema } from '../../src/esco/schemas/green-share-occupation.js';
import { ISCOGroupSchema } from '../../src/esco/schemas/isco-group.js';
import { OccupationSchema } from '../../src/esco/schemas/occupation.js';
import { OccupationCollectionSchema } from '../../src/esco/schemas/occupation-collection.js';
import { OccupationSkillRelationSchema } from '../../src/esco/schemas/occupation-skill-relation.js';
import { SkillSchema } from '../../src/esco/schemas/skill.js';
import { SkillCollectionSchema } from '../../src/esco/schemas/skill-collection.js';
import { SkillGroupSchema } from '../../src/esco/schemas/skill-group.js';
import { SkillSkillRelationSchema } from '../../src/esco/schemas/skill-skill-relation.js';
import { SkillsHierarchySchema } from '../../src/esco/schemas/skills-hierarchy.js';

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures', 'esco-dataset-v1.2.1-classification-en-csv');
const csv = (filename: string) => join(FIXTURES_DIR, filename);

describe('EscoCsvParser', () => {
  const parser = new EscoCsvParser();

  describe('parses all 19 fixture files', () => {
    test('skills_en.csv', async () => {
      const rows = await parser.parse(csv('skills_en.csv'), SkillSchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].conceptType).toBe('KnowledgeSkillCompetence');
      expect(rows[0].preferredLabel).toBe('manage musical staff');
      expect(rows[0].skillType).toBe('skill/competence');
      expect(rows[0].reuseLevel).toBe('sector-specific');
    });

    test('occupations_en.csv', async () => {
      const rows = await parser.parse(csv('occupations_en.csv'), OccupationSchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].conceptType).toBe('Occupation');
      expect(rows[0].code).toBeDefined();
    });

    test('ISCOGroups_en.csv', async () => {
      const rows = await parser.parse(csv('ISCOGroups_en.csv'), ISCOGroupSchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].conceptType).toBe('ISCOGroup');
    });

    test('skillGroups_en.csv', async () => {
      const rows = await parser.parse(csv('skillGroups_en.csv'), SkillGroupSchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].conceptType).toBe('SkillGroup');
    });

    test('occupationSkillRelations_en.csv', async () => {
      const rows = await parser.parse(csv('occupationSkillRelations_en.csv'), OccupationSkillRelationSchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].relationType).toBe('essential');
    });

    test('skillSkillRelations_en.csv', async () => {
      const rows = await parser.parse(csv('skillSkillRelations_en.csv'), SkillSkillRelationSchema);
      expect(rows.length).toBeGreaterThan(0);
    });

    test('broaderRelationsOccPillar_en.csv', async () => {
      const rows = await parser.parse(csv('broaderRelationsOccPillar_en.csv'), BroaderRelationOccPillarSchema);
      expect(rows.length).toBeGreaterThan(0);
    });

    test('broaderRelationsSkillPillar_en.csv', async () => {
      const rows = await parser.parse(csv('broaderRelationsSkillPillar_en.csv'), BroaderRelationSkillPillarSchema);
      expect(rows.length).toBeGreaterThan(0);
    });

    test('conceptSchemes_en.csv', async () => {
      const rows = await parser.parse(csv('conceptSchemes_en.csv'), ConceptSchemeSchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].conceptType).toBe('ConceptScheme');
    });

    test('dictionary_en.csv', async () => {
      const rows = await parser.parse(csv('dictionary_en.csv'), DictionarySchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].filename).toBeDefined();
    });

    test('skillsHierarchy_en.csv', async () => {
      const rows = await parser.parse(csv('skillsHierarchy_en.csv'), SkillsHierarchySchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]['Level 0 code']).toBe('L');
    });

    test('greenShareOcc_en.csv', async () => {
      const rows = await parser.parse(csv('greenShareOcc_en.csv'), GreenShareOccupationSchema);
      expect(rows.length).toBeGreaterThan(0);
    });

    test('greenSkillsCollection_en.csv', async () => {
      const rows = await parser.parse(csv('greenSkillsCollection_en.csv'), SkillCollectionSchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].conceptType).toBe('KnowledgeSkillCompetence');
    });

    test('digitalSkillsCollection_en.csv', async () => {
      const rows = await parser.parse(csv('digitalSkillsCollection_en.csv'), SkillCollectionSchema);
      expect(rows.length).toBeGreaterThan(0);
    });

    test('digCompSkillsCollection_en.csv', async () => {
      const rows = await parser.parse(csv('digCompSkillsCollection_en.csv'), SkillCollectionSchema);
      expect(rows.length).toBeGreaterThan(0);
    });

    test('transversalSkillsCollection_en.csv', async () => {
      const rows = await parser.parse(csv('transversalSkillsCollection_en.csv'), SkillCollectionSchema);
      expect(rows.length).toBeGreaterThan(0);
    });

    test('languageSkillsCollection_en.csv', async () => {
      const rows = await parser.parse(csv('languageSkillsCollection_en.csv'), SkillCollectionSchema);
      expect(rows.length).toBeGreaterThan(0);
    });

    test('researchSkillsCollection_en.csv', async () => {
      const rows = await parser.parse(csv('researchSkillsCollection_en.csv'), SkillCollectionSchema);
      expect(rows.length).toBeGreaterThan(0);
    });

    test('researchOccupationsCollection_en.csv', async () => {
      const rows = await parser.parse(csv('researchOccupationsCollection_en.csv'), OccupationCollectionSchema);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].conceptType).toBe('Occupation');
    });
  });

  describe('empty string handling', () => {
    test('converts empty CSV cells to undefined for optional fields', async () => {
      const rows = await parser.parse(csv('conceptSchemes_en.csv'), ConceptSchemeSchema);
      // Row 0 (Digital) has empty title and description
      const digital = rows.find(r => r.preferredLabel === 'Digital');
      expect(digital).toBeDefined();
      expect(digital!.title).toBeUndefined();
      expect(digital!.description).toBeUndefined();
    });

    test('preserves non-empty optional field values', async () => {
      const rows = await parser.parse(csv('conceptSchemes_en.csv'), ConceptSchemeSchema);
      const esco = rows.find(r => r.preferredLabel === 'ESCO Occupations');
      expect(esco).toBeDefined();
      expect(esco!.hasTopConcept).toBeDefined();
      expect(esco!.hasTopConcept!.length).toBeGreaterThan(0);
    });

    test('handles empty optional status in concept schemes', async () => {
      const rows = await parser.parse(csv('conceptSchemes_en.csv'), ConceptSchemeSchema);
      const withoutStatus = rows.find(r => r.preferredLabel === 'ESCO label roles');
      expect(withoutStatus).toBeDefined();
      expect(withoutStatus!.status).toBeUndefined();
    });
  });

  describe('enum validation', () => {
    test('accepts occupation-specific reuse level', async () => {
      const rows = await parser.parse(csv('skills_en.csv'), SkillSchema);
      const occupationSpecific = rows.find(r => r.reuseLevel === 'occupation-specific');
      expect(occupationSpecific).toBeDefined();
      expect(occupationSpecific!.preferredLabel).toBe('supervise correctional procedures');
    });

    test('parses all relationType variants in skillSkillRelations', async () => {
      const rows = await parser.parse(csv('skillSkillRelations_en.csv'), SkillSkillRelationSchema);
      const types = new Set(rows.map(r => r.relationType));
      expect(types.has('optional')).toBe(true);
      expect(types.has('essential')).toBe(true);
    });

    test('parses both conceptType variants in broaderRelationsOccPillar', async () => {
      const rows = await parser.parse(csv('broaderRelationsOccPillar_en.csv'), BroaderRelationOccPillarSchema);
      const types = new Set(rows.map(r => r.conceptType));
      expect(types.has('ISCOGroup')).toBe(true);
      expect(types.has('Occupation')).toBe(true);
    });

    test('parses both conceptType variants in broaderRelationsSkillPillar', async () => {
      const rows = await parser.parse(csv('broaderRelationsSkillPillar_en.csv'), BroaderRelationSkillPillarSchema);
      const types = new Set(rows.map(r => r.conceptType));
      expect(types.has('SkillGroup')).toBe(true);
      expect(types.has('KnowledgeSkillCompetence')).toBe(true);
    });

    test('handles optional skillType/reuseLevel in skill collections', async () => {
      const rows = await parser.parse(csv('digCompSkillsCollection_en.csv'), SkillCollectionSchema);
      const withoutType = rows.find(r => r.skillType === undefined);
      expect(withoutType).toBeDefined();
      const withType = rows.find(r => r.skillType !== undefined);
      expect(withType).toBeDefined();
    });
  });

  describe('type coercion', () => {
    test('coerces greenShare to number', async () => {
      const rows = await parser.parse(csv('greenShareOcc_en.csv'), GreenShareOccupationSchema);
      for (const row of rows) {
        expect(typeof row.greenShare).toBe('number');
      }
      const nonZero = rows.find(r => r.greenShare > 0);
      expect(nonZero).toBeDefined();
    });

    test('parses all greenShare conceptType variants', async () => {
      const rows = await parser.parse(csv('greenShareOcc_en.csv'), GreenShareOccupationSchema);
      const types = new Set(rows.map(r => r.conceptType));
      expect(types.has('ISCO level 3')).toBe(true);
      expect(types.has('Occupation')).toBe(true);
    });
  });

  describe('multiline fields', () => {
    test('parses newlines within quoted altLabels', async () => {
      const rows = await parser.parse(csv('skills_en.csv'), SkillSchema);
      const skill = rows.find(r => r.preferredLabel === 'manage musical staff');
      expect(skill).toBeDefined();
      expect(skill!.altLabels).toContain('\n');
    });

    test('parses multiline scope notes in skills hierarchy', async () => {
      const rows = await parser.parse(csv('skillsHierarchy_en.csv'), SkillsHierarchySchema);
      const withScopeNote = rows.find(r => r['Scope note'] !== undefined);
      expect(withScopeNote).toBeDefined();
    });
  });

  describe('skills hierarchy codes', () => {
    test('parses Level 1/2/3 code columns', async () => {
      const rows = await parser.parse(csv('skillsHierarchy_en.csv'), SkillsHierarchySchema);

      // Level 0 only — no deeper codes
      const level0 = rows.find(r => r['Level 1 URI'] === undefined);
      expect(level0).toBeDefined();
      expect(level0!['Level 0 code']).toBeDefined();
      expect(level0!['Level 1 code']).toBeUndefined();

      // Level 3 — all codes present
      const level3 = rows.find(r => r['Level 3 URI'] !== undefined);
      expect(level3).toBeDefined();
      expect(level3!['Level 1 code']).toBeDefined();
      expect(level3!['Level 2 code']).toBeDefined();
      expect(level3!['Level 3 code']).toBeDefined();
    });
  });

  describe('column order independence', () => {
    test('handles CSV columns in different order than schema keys', async () => {
      // transversalSkillsCollection has skillType,reuseLevel before preferredLabel
      // while greenSkillsCollection has preferredLabel,status before skillType
      const transversal = await parser.parse(csv('transversalSkillsCollection_en.csv'), SkillCollectionSchema);
      const green = await parser.parse(csv('greenSkillsCollection_en.csv'), SkillCollectionSchema);

      expect(transversal[0].conceptType).toBe('KnowledgeSkillCompetence');
      expect(transversal[0].skillType).toBe('skill/competence');
      expect(green[0].conceptType).toBe('KnowledgeSkillCompetence');
      expect(green[0].skillType).toBe('skill/competence');
    });
  });

  describe('error handling', () => {
    test('throws EscoCsvParseError with row details on invalid data', async () => {
      const tmpPath = join(import.meta.dirname, 'fixtures', 'invalid_test.csv');
      writeFileSync(tmpPath, 'conceptType,conceptUri,code,preferredLabel,greenShare\nBadType,not-a-url,001,Test,abc\n');

      try {
        await parser.parse(tmpPath, GreenShareOccupationSchema);
        throw new Error('should have thrown');
      } catch (error) {
        if (error instanceof Error && error.message === 'should have thrown') throw error;
        expect(error).toBeInstanceOf(EscoCsvParseError);
        const csvError = error as EscoCsvParseError;
        expect(csvError.filePath).toBe(tmpPath);
        expect(csvError.rowErrors.size).toBe(1);
        expect(csvError.rowErrors.has(0)).toBe(true);
      } finally {
        if (existsSync(tmpPath)) {
          unlinkSync(tmpPath);
        }
      }
    });

    test('throws when file does not exist', async () => {
      await expect(parser.parse('/nonexistent/file.csv', SkillSchema)).rejects.toThrow();
    });
  });
});
