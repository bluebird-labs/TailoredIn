import type {
  MakeResumeContentFromGeneratedInput,
  MakeResumeContentFromSelectionInput,
  ResumeContentDto,
  ResumeContentFactory
} from '@tailoredin/application';
import { StringUtil } from '@tailoredin/core';
import type {
  EducationRepository,
  ExperienceRepository,
  ProfileRepository,
  SkillCategoryRepository
} from '@tailoredin/domain';
import { formatDateRange } from '../resume/dateFormatter.js';

export class DatabaseResumeContentFactory implements ResumeContentFactory {
  public constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly experienceRepo: ExperienceRepository,
    private readonly educationRepo: EducationRepository,
    private readonly skillCategoryRepo: SkillCategoryRepository
  ) {}

  public async makeFromSelection(input: MakeResumeContentFromSelectionInput): Promise<ResumeContentDto> {
    const [profile, allExperiences, allEducation, allCategories] = await Promise.all([
      this.profileRepo.findSingle(),
      this.experienceRepo.findAll(),
      this.educationRepo.findAll(),
      this.skillCategoryRepo.findAll()
    ]);

    // Personal
    const personal = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      phone: profile.phone ?? '',
      github: extractHandle(profile.githubUrl),
      linkedin: extractHandle(profile.linkedinUrl),
      location: profile.location ?? '',
      header_quote: input.headlineText
    };

    // Experience — from experienceSelections
    const experienceMap = new Map(allExperiences.map(e => [e.id.value, e]));

    const bulletMap = new Map<string, { text: string; ordinal: number }>();
    for (const exp of allExperiences) {
      for (const bullet of exp.bullets) {
        bulletMap.set(bullet.id.value, { text: bullet.content, ordinal: bullet.ordinal });
      }
    }

    const experience = input.experienceSelections.map(sel => {
      const exp = experienceMap.get(sel.experienceId);
      if (!exp) {
        throw new Error(`Experience not found: ${sel.experienceId}`);
      }

      const highlights: string[] = [];
      for (const bulletId of sel.bulletIds) {
        const entry = bulletMap.get(bulletId);
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

    // Education — from educationIds
    const educationMap = new Map(allEducation.map(e => [e.id.value, e]));
    const education = input.educationIds.map(id => {
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

    // Skills — from skillCategoryIds + skillItemIds (with Typst escaping)
    const categoryMap = new Map(allCategories.map(c => [c.id.value, c]));
    const selectedItemIds = new Set(input.skillItemIds);

    const skills = input.skillCategoryIds.map(catId => {
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
      keywords: input.keywords,
      experience,
      skills,
      education
    };
  }

  public async makeFromGeneratedContent(input: MakeResumeContentFromGeneratedInput): Promise<ResumeContentDto> {
    const [profile, allExperiences, allEducation, allCategories] = await Promise.all([
      this.profileRepo.findSingle(),
      this.experienceRepo.findAll(),
      this.educationRepo.findAll(),
      this.skillCategoryRepo.findAll()
    ]);

    const personal = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      phone: profile.phone ?? '',
      github: extractHandle(profile.githubUrl),
      linkedin: extractHandle(profile.linkedinUrl),
      location: profile.location ?? '',
      header_quote: input.headlineText
    };

    const experienceMap = new Map(allExperiences.map(e => [e.id.value, e]));

    const experience = input.generatedContent.experiences.map(gen => {
      const exp = experienceMap.get(gen.experienceId);
      if (!exp) {
        throw new Error(`Experience not found: ${gen.experienceId}`);
      }

      const highlights = gen.bulletTexts.map(text => StringUtil.ensureEndsWith(text, '.'));

      return {
        title: exp.title,
        society: exp.companyName,
        date: formatDateRange(exp.startDate, exp.endDate),
        location: exp.location,
        summary: exp.summary ?? '',
        highlights
      };
    });

    const educationMap = new Map(allEducation.map(e => [e.id.value, e]));
    const education = input.educationIds.map(id => {
      const edu = educationMap.get(id);
      if (!edu) throw new Error(`Education not found: ${id}`);
      return {
        title: edu.degreeTitle,
        society: edu.institutionName,
        date: String(edu.graduationYear),
        location: edu.location ?? ''
      };
    });

    const categoryMap = new Map(allCategories.map(c => [c.id.value, c]));
    const selectedItemIds = new Set(input.skillItemIds);

    const skills = input.skillCategoryIds.map(catId => {
      const cat = categoryMap.get(catId);
      if (!cat) throw new Error(`Skill category not found: ${catId}`);

      const filteredItems = cat.items
        .filter(item => selectedItemIds.has(item.id.value))
        .sort((a, b) => a.ordinal - b.ordinal);

      const info = filteredItems.map(item => item.name.replace(/#/g, '\\#')).join(' #h-bar() ');
      return { type: cat.name, info };
    });

    return {
      personal,
      keywords: input.keywords,
      experience,
      skills,
      education
    };
  }
}

/** Extract the last path segment from a URL, or return the string as-is if not a URL. */
function extractHandle(url: string | null): string {
  if (!url) return '';
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').filter(Boolean).pop() ?? url;
  } catch {
    return url;
  }
}
