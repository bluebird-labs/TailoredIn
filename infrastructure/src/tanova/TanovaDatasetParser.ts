import { Logger } from '@tailoredin/core';
import { type TanovaSkill, TanovaTaxonomySchema } from './schemas/tanova-skill.js';

export class TanovaDatasetParser {
  private readonly log = Logger.create(this);

  public async parse(filePath: string): Promise<{ skills: TanovaSkill[]; version: string }> {
    const raw = await Bun.file(filePath).json();
    const taxonomy = TanovaTaxonomySchema.parse(raw);

    const skills: TanovaSkill[] = [];
    for (const [_category, { subcategories }] of Object.entries(taxonomy.categories)) {
      for (const [_subcategory, { skills: subcategorySkills }] of Object.entries(subcategories)) {
        skills.push(...subcategorySkills);
      }
    }

    this.log.info(`Parsed ${skills.length} skills from ${filePath}`);
    return { skills, version: taxonomy.version };
  }
}
