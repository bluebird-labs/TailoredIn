import { Injectable } from '@nestjs/common';
import type { EscoCsvParser } from './EscoCsvParser.js';
import type { EscoDataset } from './EscoDataset.js';
import type { EscoDirectory } from './EscoDirectoryLoader.js';
import { BroaderRelationOccPillarSchema } from './schemas/broader-relation-occ-pillar.js';
import { BroaderRelationSkillPillarSchema } from './schemas/broader-relation-skill-pillar.js';
import { ConceptSchemeSchema } from './schemas/concept-scheme.js';
import { DictionarySchema } from './schemas/dictionary.js';
import { GreenShareOccupationSchema } from './schemas/green-share-occupation.js';
import { ISCOGroupSchema } from './schemas/isco-group.js';
import { OccupationSchema } from './schemas/occupation.js';
import { OccupationCollectionSchema } from './schemas/occupation-collection.js';
import { OccupationSkillRelationSchema } from './schemas/occupation-skill-relation.js';
import { SkillSchema } from './schemas/skill.js';
import { SkillCollectionSchema } from './schemas/skill-collection.js';
import { SkillGroupSchema } from './schemas/skill-group.js';
import { SkillSkillRelationSchema } from './schemas/skill-skill-relation.js';
import { SkillsHierarchySchema } from './schemas/skills-hierarchy.js';

@Injectable()
export class EscoDatasetParser {
  public constructor(private readonly csvParser: EscoCsvParser) {}

  public async parse(directory: EscoDirectory): Promise<EscoDataset> {
    const [
      skills,
      occupations,
      iscoGroups,
      skillGroups,
      occupationSkillRelations,
      skillSkillRelations,
      broaderRelationsOccPillar,
      broaderRelationsSkillPillar,
      conceptSchemes,
      dictionary,
      skillsHierarchy,
      greenShareOcc,
      greenSkillsCollection,
      digitalSkillsCollection,
      digCompSkillsCollection,
      transversalSkillsCollection,
      languageSkillsCollection,
      researchSkillsCollection,
      researchOccupationsCollection
    ] = await Promise.all([
      this.csvParser.parse(directory.skills, SkillSchema),
      this.csvParser.parse(directory.occupations, OccupationSchema),
      this.csvParser.parse(directory.iscoGroups, ISCOGroupSchema),
      this.csvParser.parse(directory.skillGroups, SkillGroupSchema),
      this.csvParser.parse(directory.occupationSkillRelations, OccupationSkillRelationSchema),
      this.csvParser.parse(directory.skillSkillRelations, SkillSkillRelationSchema),
      this.csvParser.parse(directory.broaderRelationsOccPillar, BroaderRelationOccPillarSchema),
      this.csvParser.parse(directory.broaderRelationsSkillPillar, BroaderRelationSkillPillarSchema),
      this.csvParser.parse(directory.conceptSchemes, ConceptSchemeSchema),
      this.csvParser.parse(directory.dictionary, DictionarySchema),
      this.csvParser.parse(directory.skillsHierarchy, SkillsHierarchySchema),
      this.csvParser.parse(directory.greenShareOcc, GreenShareOccupationSchema),
      this.csvParser.parse(directory.greenSkillsCollection, SkillCollectionSchema),
      this.csvParser.parse(directory.digitalSkillsCollection, SkillCollectionSchema),
      this.csvParser.parse(directory.digCompSkillsCollection, SkillCollectionSchema),
      this.csvParser.parse(directory.transversalSkillsCollection, SkillCollectionSchema),
      this.csvParser.parse(directory.languageSkillsCollection, SkillCollectionSchema),
      this.csvParser.parse(directory.researchSkillsCollection, SkillCollectionSchema),
      this.csvParser.parse(directory.researchOccupationsCollection, OccupationCollectionSchema)
    ]);

    return {
      skills,
      occupations,
      iscoGroups,
      skillGroups,
      occupationSkillRelations,
      skillSkillRelations,
      broaderRelationsOccPillar,
      broaderRelationsSkillPillar,
      conceptSchemes,
      dictionary,
      skillsHierarchy,
      greenShareOcc,
      greenSkillsCollection,
      digitalSkillsCollection,
      digCompSkillsCollection,
      transversalSkillsCollection,
      languageSkillsCollection,
      researchSkillsCollection,
      researchOccupationsCollection
    };
  }
}
