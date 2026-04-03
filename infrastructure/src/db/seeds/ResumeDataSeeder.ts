import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Logger } from '@tailoredin/core';
import {
  archetypeDefs,
  bulletDefs,
  type CompanyKey,
  companyDefs,
  educationDefs,
  headlineData,
  skillCategoryDefs,
  userData
} from './data/resume-data.js';

export class ResumeDataSeeder extends Seeder {
  public async run(em: EntityManager): Promise<void> {
    const esc = (s: string) => s.replace(/'/g, "''");
    const conn = em.getConnection();

    // Profile
    const [profileRow] = await conn.execute<[{ id: string }]>(
      `INSERT INTO profiles (email, first_name, last_name, phone, location, linkedin_url, github_url, website_url)
       VALUES ('${esc(userData.email)}', '${esc(userData.firstName)}', '${esc(userData.lastName)}',
               '${userData.phoneNumber}', '${esc(userData.locationLabel)}',
               'https://linkedin.com/in/${userData.linkedinHandle}',
               'https://github.com/${userData.githubHandle}', NULL)
       RETURNING id`
    );
    const profileId = profileRow.id;

    // Skill categories + items — tracking IDs for content_selection
    const skillCatIds: Record<string, string> = {};
    const skillItemIdsByCategory: Record<string, string[]> = {};
    for (let ci = 0; ci < skillCategoryDefs.length; ci++) {
      const [catName, skillNames] = skillCategoryDefs[ci];
      const [catRow] = await conn.execute<[{ id: string }]>(
        `INSERT INTO skill_categories (id, profile_id, name, ordinal)
         VALUES (gen_random_uuid(), '${profileId}', '${esc(catName)}', ${ci})
         RETURNING id`
      );
      skillCatIds[catName] = catRow.id;
      skillItemIdsByCategory[catName] = [];
      for (let si = 0; si < skillNames.length; si++) {
        const [itemRow] = await conn.execute<[{ id: string }]>(
          `INSERT INTO skill_items (id, skill_category_id, name, ordinal)
           VALUES (gen_random_uuid(), '${catRow.id}', '${esc(skillNames[si])}', ${si})
           RETURNING id`
        );
        skillItemIdsByCategory[catName].push(itemRow.id);
      }
    }

    // Education — tracking IDs
    const eduIds: string[] = [];
    for (let ei = 0; ei < educationDefs.length; ei++) {
      const def = educationDefs[ei];
      const [eduRow] = await conn.execute<[{ id: string }]>(
        `INSERT INTO educations (id, profile_id, degree_title, institution_name, graduation_year, location, honors, ordinal)
         VALUES (gen_random_uuid(), '${profileId}', '${esc(def.degreeTitle)}', '${esc(def.institutionName)}',
                 ${Number.parseInt(def.graduationYear, 10)}, '${esc(def.locationLabel)}', NULL, ${ei})
         RETURNING id`
      );
      eduIds.push(eduRow.id);
    }

    // Headlines
    await conn.execute(
      `INSERT INTO headlines (id, profile_id, label, summary_text)
       VALUES (gen_random_uuid(), '${profileId}', '${esc(headlineData.headlineLabel)}', '${esc(headlineData.summaryText)}')`
    );

    // Experiences — real titles from Lead IC archetype, Volvo gets 2 positions (8 total)
    const leadIcPositions = archetypeDefs[0].positions;
    const experienceIdMap = new Map<string, string>(); // "companyKey:positionIndex" → experience ID

    for (let pi = 0; pi < leadIcPositions.length; pi++) {
      const posDef = leadIcPositions[pi];
      const compDef = companyDefs[posDef.companyKey];
      const [expRow] = await conn.execute<[{ id: string }]>(
        `INSERT INTO experiences (id, profile_id, title, company_name, company_website, location, start_date, end_date, summary, ordinal)
         VALUES (gen_random_uuid(), '${profileId}', '${esc(posDef.jobTitle)}', '${esc(compDef.companyName)}',
                 ${compDef.websiteUrl ? `'${compDef.websiteUrl}'` : 'NULL'}, '${esc(posDef.locationLabel)}',
                 '${posDef.startDate}', '${posDef.endDate}', '${esc(posDef.roleSummary)}', ${pi})
         RETURNING id`
      );
      experienceIdMap.set(`${posDef.companyKey}:${posDef.positionIndex}`, expRow.id);
    }

    // Bullets — assign to experiences; for Volvo split by position index
    const bulletIdsByExperience = new Map<string, string[]>();
    const bulletPositionMap = new Map<CompanyKey, Map<number, number>>();
    for (const posDef of leadIcPositions) {
      if (!bulletPositionMap.has(posDef.companyKey)) {
        bulletPositionMap.set(posDef.companyKey, new Map());
      }
      for (const bi of posDef.bulletIndices) {
        bulletPositionMap.get(posDef.companyKey)!.set(bi, posDef.positionIndex);
      }
    }

    for (const [companyKey, texts] of Object.entries(bulletDefs) as [CompanyKey, string[]][]) {
      const posMap = bulletPositionMap.get(companyKey) ?? new Map();
      const grouped = new Map<number, { idx: number; text: string }[]>();
      for (let i = 0; i < texts.length; i++) {
        const posIdx = posMap.get(i) ?? 0;
        if (!grouped.has(posIdx)) grouped.set(posIdx, []);
        grouped.get(posIdx)!.push({ idx: i, text: texts[i] });
      }
      for (const [posIdx, group] of grouped) {
        const expId = experienceIdMap.get(`${companyKey}:${posIdx}`);
        if (!expId) continue;
        for (let bi = 0; bi < group.length; bi++) {
          const bulletId = crypto.randomUUID();
          await conn.execute(
            `INSERT INTO bullets (id, experience_id, content, ordinal)
             VALUES ('${bulletId}', '${expId}', '${esc(group[bi].text)}', ${bi})`
          );
          if (!bulletIdsByExperience.has(expId)) bulletIdsByExperience.set(expId, []);
          bulletIdsByExperience.get(expId)!.push(bulletId);
        }
      }
    }

    // Resume profile — seed from the leader_individual_contributor archetype definition (archetypeDefs[0])
    const leadIcDef = archetypeDefs[0];
    {
      const experienceSelections = leadIcDef.positions.map(posDef => {
        const expId = experienceIdMap.get(`${posDef.companyKey}:${posDef.positionIndex}`)!;
        return {
          experienceId: expId,
          bulletIds: bulletIdsByExperience.get(expId) ?? []
        };
      });

      const selectedEduIds = leadIcDef.educationIndices.map(i => eduIds[i]);
      const allSkillCatIds = Object.values(skillCatIds);

      const selectedSkillItemIds: string[] = [];
      for (const [catName, itemIds] of Object.entries(skillItemIdsByCategory)) {
        if (catName === 'interests' && leadIcDef.interestItemOverrides) {
          const interestNames = skillCategoryDefs.find(([n]) => n === 'interests')![1];
          for (let i = 0; i < interestNames.length; i++) {
            if (leadIcDef.interestItemOverrides.includes(interestNames[i])) {
              selectedSkillItemIds.push(itemIds[i]);
            }
          }
        } else {
          selectedSkillItemIds.push(...itemIds);
        }
      }

      const contentSelection = {
        experienceSelections,
        projectIds: [],
        educationIds: selectedEduIds,
        skillCategoryIds: allSkillCatIds,
        skillItemIds: selectedSkillItemIds
      };

      await conn.execute(
        `INSERT INTO resume_profiles (profile_id, content_selection, headline_text, updated_at)
         VALUES ('${profileId}', '${JSON.stringify(contentSelection).replace(/'/g, "''")}'::jsonb,
                 '${esc(headlineData.summaryText)}', now())
         ON CONFLICT DO NOTHING`
      );
    }

    Logger.create(this.constructor.name).info('Profile data seeded successfully.');
  }
}
