import type { MakeResumeContentInput, ResumeContentDto, ResumeContentFactory } from '@tailoredin/application';
import { StringUtil } from '@tailoredin/core';
import type {
  ArchetypeRepository,
  EducationRepository,
  ExperienceRepository,
  HeadlineRepository,
  ProfileRepository,
  SkillCategoryRepository
} from '@tailoredin/domain';
import { formatDateRange } from '../resume/dateFormatter.js';

export class DatabaseResumeContentFactory implements ResumeContentFactory {
  public constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly headlineRepo: HeadlineRepository,
    private readonly archetypeRepo: ArchetypeRepository,
    private readonly experienceRepo: ExperienceRepository,
    private readonly educationRepo: EducationRepository,
    private readonly skillCategoryRepo: SkillCategoryRepository
  ) {}

  public async make(input: MakeResumeContentInput): Promise<ResumeContentDto> {
    const archetype = await this.archetypeRepo.findByIdOrFail(input.archetypeId);
    const cs = archetype.contentSelection;

    const [profile, allExperiences, allEducation, allCategories] = await Promise.all([
      this.profileRepo.findSingle(),
      this.experienceRepo.findAll(),
      this.educationRepo.findAll(),
      this.skillCategoryRepo.findAll()
    ]);

    // Headline — from archetype or fallback to first available
    const headlines = await this.headlineRepo.findAll();
    const headline = archetype.headlineId
      ? (headlines.find(h => h.id.value === archetype.headlineId) ?? headlines[0])
      : headlines[0];
    if (!headline) {
      throw new Error('No headlines found');
    }

    // Personal
    const personal = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      phone: profile.phone ?? '',
      github: profile.githubUrl ?? '',
      linkedin: profile.linkedinUrl ?? '',
      location: profile.location ?? '',
      header_quote: headline.summaryText
    };

    // Experience — from content_selection experienceSelections
    const experienceMap = new Map(allExperiences.map(e => [e.id.value, e]));

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

    const experience = cs.experienceSelections.map(sel => {
      const exp = experienceMap.get(sel.experienceId);
      if (!exp) {
        throw new Error(`Experience not found: ${sel.experienceId}`);
      }

      const highlights: string[] = [];
      for (const variantId of sel.bulletVariantIds) {
        const entry = variantMap.get(variantId);
        if (!entry) {
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

    // Education — from content_selection educationIds
    const educationMap = new Map(allEducation.map(e => [e.id.value, e]));
    const education = cs.educationIds.map(id => {
      const edu = educationMap.get(id);
      if (!edu) {
        throw new Error(`Education not found: ${id}`);
      }
      return {
        title: edu.degreeTitle,
        society: edu.institutionName,
        date: String(edu.graduationYear),
        location: edu.location ?? ''
      };
    });

    // Skills — from content_selection skillCategoryIds + skillItemIds
    const categoryMap = new Map(allCategories.map(c => [c.id.value, c]));
    const selectedItemIds = new Set(cs.skillItemIds);

    const skills = cs.skillCategoryIds.map(catId => {
      const cat = categoryMap.get(catId);
      if (!cat) {
        throw new Error(`Skill category not found: ${catId}`);
      }

      const filteredItems = cat.items
        .filter(item => selectedItemIds.has(item.id.value))
        .sort((a, b) => a.ordinal - b.ordinal);

      const info = filteredItems.map(item => item.name.replace(/#/g, '\\#')).join(' #h-bar() ');

      return { type: cat.name, info };
    });

    return {
      personal,
      awesome_color: input.awesomeColor,
      keywords: input.keywords,
      experience,
      skills,
      education
    };
  }
}
