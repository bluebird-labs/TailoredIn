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

    // Profile (new domain model — required for skill_categories FK)
    const existingProfile = await em.getConnection().execute<[{ id: string }]>('SELECT id FROM profiles LIMIT 1');
    if (!existingProfile.length) {
      await em.getConnection().execute(`
        INSERT INTO profiles (email, first_name, last_name)
        SELECT email, first_name, last_name FROM users LIMIT 1
      `);
    }

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

    // ── New domain model tables (profile already created above) ──
    const profileRows = await em.getConnection().execute<[{ id: string }]>('SELECT id FROM profiles LIMIT 1');
    if (profileRows.length > 0) {
      const profileId = profileRows[0].id;

      // Skill categories + items → skill_categories / skill_items
      for (let ci = 0; ci < skillCategoryDefs.length; ci++) {
        const [catName, skillNames] = skillCategoryDefs[ci];
        const [catRow] = await em.getConnection().execute<[{ id: string }]>(
          `INSERT INTO skill_categories (id, profile_id, name, ordinal)
           VALUES (gen_random_uuid(), '${profileId}', '${catName.replace(/'/g, "''")}', ${ci})
           RETURNING id`
        );
        for (let si = 0; si < skillNames.length; si++) {
          await em.getConnection().execute(
            `INSERT INTO skill_items (id, skill_category_id, name, ordinal)
             VALUES (gen_random_uuid(), '${catRow.id}', '${skillNames[si].replace(/'/g, "''")}', ${si})`
          );
        }
      }

      // Education → educations table
      for (let ei = 0; ei < educationDefs.length; ei++) {
        const def = educationDefs[ei];
        await em.getConnection().execute(
          `INSERT INTO educations (id, profile_id, degree_title, institution_name, graduation_year, location, honors, ordinal)
           VALUES (gen_random_uuid(), '${profileId}', '${def.degreeTitle.replace(/'/g, "''")}', '${def.institutionName.replace(/'/g, "''")}', ${parseInt(def.graduationYear, 10)}, '${(def.locationLabel ?? '').replace(/'/g, "''")}', NULL, ${ei})`
        );
      }

      // Headlines → headlines table
      await em.getConnection().execute(
        `INSERT INTO headlines (id, profile_id, label, summary_text)
         VALUES (gen_random_uuid(), '${profileId}', '${headlineData.headlineLabel.replace(/'/g, "''")}', '${headlineData.summaryText.replace(/'/g, "''")}')`
      );

      // Experiences → experiences table
      const companyEntries = Object.entries(companyDefs) as [CompanyKey, (typeof companyDefs)[CompanyKey]][];
      for (let ei = 0; ei < companyEntries.length; ei++) {
        const [, def] = companyEntries[ei];
        await em.getConnection().execute(
          `INSERT INTO experiences (id, profile_id, title, company_name, company_website, location, start_date, end_date, summary, ordinal)
           VALUES (gen_random_uuid(), '${profileId}', 'Software Engineer', '${def.companyName.replace(/'/g, "''")}', ${def.websiteUrl ? `'${def.websiteUrl}'` : 'NULL'}, '${(def.locations[0] ?? '').replace(/'/g, "''")}', '${def.joinedAt}', '${def.leftAt}', NULL, ${ei})`
        );
      }
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
