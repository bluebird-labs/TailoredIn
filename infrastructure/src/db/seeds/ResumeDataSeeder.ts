import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Logger } from '@tailoredin/core';
import { Archetype } from '../entities/archetypes/Archetype.js';
import { ArchetypeEducation } from '../entities/archetypes/ArchetypeEducation.js';
import { ArchetypePosition } from '../entities/archetypes/ArchetypePosition.js';
import { ArchetypePositionBullet } from '../entities/archetypes/ArchetypePositionBullet.js';
import { ArchetypeSkillCategory } from '../entities/archetypes/ArchetypeSkillCategory.js';
import { ArchetypeSkillItem } from '../entities/archetypes/ArchetypeSkillItem.js';
import { ResumeBullet } from '../entities/resume/ResumeBullet.js';
import { ResumeCompany } from '../entities/resume/ResumeCompany.js';
import { ResumeCompanyLocation } from '../entities/resume/ResumeCompanyLocation.js';
import { ResumeEducation } from '../entities/resume/ResumeEducation.js';
import { ResumeHeadline } from '../entities/resume/ResumeHeadline.js';
import { ResumePosition } from '../entities/resume/ResumePosition.js';
import { ResumeSkillCategory } from '../entities/resume/ResumeSkillCategory.js';
import { ResumeSkillItem } from '../entities/resume/ResumeSkillItem.js';
import { User } from '../entities/users/User.js';
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
    const user = User.create(userData);
    em.persist(user);
    await em.flush();

    // Profile (new domain model — anchor for all new table FKs)
    const esc = (s: string) => s.replace(/'/g, "''");
    const conn = em.getConnection();
    const [profileRow] = await conn.execute<[{ id: string }]>(
      `INSERT INTO profiles (email, first_name, last_name, phone, location, linkedin_url, github_url, website_url)
       VALUES ('${esc(userData.email)}', '${esc(userData.firstName)}', '${esc(userData.lastName)}',
               '${userData.phoneNumber}', '${esc(userData.locationLabel)}',
               'https://linkedin.com/in/${userData.linkedinHandle}',
               'https://github.com/${userData.githubHandle}', NULL)
       RETURNING id`
    );
    const profileId = profileRow.id;

    // Companies + positions + locations
    const companies: Record<CompanyKey, ResumeCompany> = {} as Record<CompanyKey, ResumeCompany>;
    const positions: Record<CompanyKey, ResumePosition[]> = {} as Record<CompanyKey, ResumePosition[]>;

    for (const [key, def] of Object.entries(companyDefs) as [CompanyKey, (typeof companyDefs)[CompanyKey]][]) {
      const company = ResumeCompany.create({
        user,
        companyName: def.companyName,
        companyMention: def.companyMention,
        websiteUrl: def.websiteUrl,
        businessDomain: def.businessDomain
      });
      em.persist(company);
      companies[key] = company;

      for (let i = 0; i < def.locations.length; i++) {
        em.persist(
          ResumeCompanyLocation.create({ resumeCompany: company, locationLabel: def.locations[i], ordinal: i })
        );
      }

      if (def.promotedAt) {
        const promoted = ResumePosition.create({
          resumeCompany: company,
          title: '',
          startDate: def.promotedAt,
          endDate: def.leftAt,
          summary: null,
          ordinal: 0
        });
        const original = ResumePosition.create({
          resumeCompany: company,
          title: '',
          startDate: def.joinedAt,
          endDate: def.promotedAt,
          summary: null,
          ordinal: 1
        });
        em.persist(promoted);
        em.persist(original);
        positions[key] = [promoted, original];
      } else {
        const position = ResumePosition.create({
          resumeCompany: company,
          title: '',
          startDate: def.joinedAt,
          endDate: def.leftAt,
          summary: null,
          ordinal: 0
        });
        em.persist(position);
        positions[key] = [position];
      }
    }

    // Bullets
    const bullets: Record<CompanyKey, ResumeBullet[]> = {} as Record<CompanyKey, ResumeBullet[]>;
    for (const [key, texts] of Object.entries(bulletDefs) as [CompanyKey, string[]][]) {
      bullets[key] = texts.map((content, i) => {
        const bullet = ResumeBullet.create({ resumePosition: positions[key][0], content, ordinal: i });
        em.persist(bullet);
        return bullet;
      });
    }

    // Education
    const education = educationDefs.map((def, i) => {
      const edu = ResumeEducation.create({ user, ...def, ordinal: i });
      em.persist(edu);
      return edu;
    });

    // Skill categories + items
    const categories: Record<string, ResumeSkillCategory> = {};
    const items: Record<string, ResumeSkillItem[]> = {};

    for (let ci = 0; ci < skillCategoryDefs.length; ci++) {
      const [catName, skillNames] = skillCategoryDefs[ci];
      const cat = ResumeSkillCategory.create({ user, categoryName: catName, ordinal: ci });
      em.persist(cat);
      categories[catName] = cat;
      items[catName] = skillNames.map((skillName, si) => {
        const item = ResumeSkillItem.create({ category: cat, skillName, ordinal: si });
        em.persist(item);
        return item;
      });
    }

    // ── New domain model tables (profile created above) ──

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

    // Headlines — tracking IDs
    const [headlineRow] = await conn.execute<[{ id: string }]>(
      `INSERT INTO headlines (id, profile_id, label, summary_text)
       VALUES (gen_random_uuid(), '${profileId}', '${esc(headlineData.headlineLabel)}', '${esc(headlineData.summaryText)}')
       RETURNING id`
    );
    const newHeadlineId = headlineRow.id;

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
          await conn.execute(
            `INSERT INTO bullets (id, experience_id, content, ordinal)
             VALUES (gen_random_uuid(), '${expId}', '${esc(group[bi].text)}', ${bi})`
          );
        }
      }
    }

    // Archetypes (archetypes_v2) — 2 archetypes with content_selection JSONB
    for (const def of archetypeDefs) {
      const experienceSelections = def.positions.map(posDef => ({
        experienceId: experienceIdMap.get(`${posDef.companyKey}:${posDef.positionIndex}`)!,
        bulletVariantIds: [] as string[]
      }));

      const selectedEduIds = def.educationIndices.map(i => eduIds[i]);
      const allSkillCatIds = Object.values(skillCatIds);

      const selectedSkillItemIds: string[] = [];
      for (const [catName, itemIds] of Object.entries(skillItemIdsByCategory)) {
        if (catName === 'interests' && def.interestItemOverrides) {
          const interestNames = skillCategoryDefs.find(([n]) => n === 'interests')![1];
          for (let i = 0; i < interestNames.length; i++) {
            if (def.interestItemOverrides.includes(interestNames[i])) {
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
        `INSERT INTO archetypes_v2 (id, profile_id, key, label, headline_id, content_selection)
         VALUES (gen_random_uuid(), '${profileId}', '${esc(def.archetypeKey)}', '${esc(def.archetypeLabel)}',
                 '${newHeadlineId}', '${JSON.stringify(contentSelection).replace(/'/g, "''")}'::jsonb)`
      );
    }

    // Headline
    const headline = ResumeHeadline.create({ user, ...headlineData });
    em.persist(headline);

    // Archetypes
    for (const def of archetypeDefs) {
      const archetype = Archetype.create({
        user,
        archetypeKey: def.archetypeKey,
        archetypeLabel: def.archetypeLabel,
        archetypeDescription: def.archetypeDescription,
        headline,
        socialNetworks: def.socialNetworks
      });
      em.persist(archetype);

      for (const ei of def.educationIndices) {
        em.persist(ArchetypeEducation.create({ archetype, education: education[ei], ordinal: ei }));
      }

      for (const [, cat] of Object.entries(categories)) {
        em.persist(ArchetypeSkillCategory.create({ archetype, category: cat, ordinal: cat.ordinal }));
      }

      if (def.interestItemOverrides) {
        const interestItems = items.interests;
        const overrideItems = interestItems.filter(item => def.interestItemOverrides!.includes(item.skillName));
        for (let i = 0; i < overrideItems.length; i++) {
          em.persist(ArchetypeSkillItem.create({ archetype, item: overrideItems[i], ordinal: i }));
        }
      }

      for (let pi = 0; pi < def.positions.length; pi++) {
        const posDef = def.positions[pi];
        const pos = ArchetypePosition.create({
          archetype,
          resumePosition: positions[posDef.companyKey][posDef.positionIndex],
          jobTitle: posDef.jobTitle,
          displayCompanyName: posDef.displayCompanyName,
          locationLabel: posDef.locationLabel,
          startDate: posDef.startDate,
          endDate: posDef.endDate,
          roleSummary: posDef.roleSummary,
          ordinal: pi
        });
        em.persist(pos);

        for (let bi = 0; bi < posDef.bulletIndices.length; bi++) {
          em.persist(
            ArchetypePositionBullet.create({
              position: pos,
              bullet: bullets[posDef.companyKey][posDef.bulletIndices[bi]],
              ordinal: bi
            })
          );
        }
      }
    }

    await em.flush();
    Logger.create(this.constructor.name).info('Resume data seeded successfully.');
  }
}
