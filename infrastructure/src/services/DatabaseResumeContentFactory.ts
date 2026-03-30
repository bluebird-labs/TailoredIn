import type { MakeResumeContentInput, ResumeContentDto, ResumeContentFactory } from '@tailoredin/application';
import { StringUtil } from '@tailoredin/core';
import type {
  ArchetypeConfigRepository,
  ResumeCompanyRepository,
  ResumeEducationRepository,
  ResumeHeadlineRepository,
  ResumeSkillCategoryRepository,
  UserRepository
} from '@tailoredin/domain';
import { formatDateRange } from '../resume/dateFormatter.js';

export class DatabaseResumeContentFactory implements ResumeContentFactory {
  public constructor(
    private readonly userRepo: UserRepository,
    private readonly headlineRepo: ResumeHeadlineRepository,
    private readonly archetypeConfigRepo: ArchetypeConfigRepository,
    private readonly companyRepo: ResumeCompanyRepository,
    private readonly educationRepo: ResumeEducationRepository,
    private readonly skillCategoryRepo: ResumeSkillCategoryRepository
  ) {}

  public async make(input: MakeResumeContentInput): Promise<ResumeContentDto> {
    const config = await this.archetypeConfigRepo.findByUserAndKey(input.userId, input.archetype);
    if (!config) {
      throw new Error(`ArchetypeConfig not found for archetype: ${input.archetype}`);
    }

    const [user, headline, companies, allEducation, allCategories] = await Promise.all([
      this.userRepo.findByIdOrFail(input.userId),
      this.headlineRepo.findByIdOrFail(config.headlineId),
      this.companyRepo.findAllByUserId(input.userId),
      this.educationRepo.findAllByUserId(input.userId),
      this.skillCategoryRepo.findAllByUserId(input.userId)
    ]);

    // Build bullet lookup from all companies
    const bulletMap = new Map<string, string>();
    for (const company of companies) {
      for (const bullet of company.bullets) {
        bulletMap.set(bullet.id.value, bullet.content);
      }
    }

    // Personal
    const personal = {
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phoneNumber ?? '',
      github: user.githubHandle ?? '',
      linkedin: user.linkedinHandle ?? '',
      location: user.locationLabel ?? '',
      header_quote: headline.summaryText
    };

    // Experience — from archetype positions
    const sortedPositions = [...config.positions].sort((a, b) => a.ordinal - b.ordinal);
    const experience = sortedPositions.map(position => {
      const sortedBullets = [...position.bullets].sort((a, b) => a.ordinal - b.ordinal);
      const highlights = sortedBullets.map(ref => {
        const content = bulletMap.get(ref.bulletId);
        if (!content) {
          throw new Error(`Bullet not found: ${ref.bulletId}`);
        }
        return StringUtil.ensureEndsWith(content, '.');
      });

      return {
        title: position.jobTitle,
        society: position.displayCompanyName,
        date: formatDateRange(position.startDate, position.endDate),
        location: position.locationLabel,
        summary: position.roleSummary,
        highlights
      };
    });

    // Education — from archetype education selections
    const educationMap = new Map(allEducation.map(e => [e.id.value, e]));
    const sortedEducationSelections = [...config.educationSelections].sort((a, b) => a.ordinal - b.ordinal);
    const education = sortedEducationSelections.map(sel => {
      const entry = educationMap.get(sel.educationId);
      if (!entry) {
        throw new Error(`Education entry not found: ${sel.educationId}`);
      }
      return {
        title: entry.degreeTitle,
        society: entry.institutionName,
        date: entry.graduationYear,
        location: entry.locationLabel
      };
    });

    // Skills — from archetype skill category + item selections
    const categoryMap = new Map(allCategories.map(c => [c.id.value, c]));

    // Build a set of selected item IDs and their ordinals from the archetype
    const selectedItemOrdinals = new Map(config.skillItemSelections.map(sel => [sel.itemId, sel.ordinal]));

    const sortedCategorySelections = [...config.skillCategorySelections].sort((a, b) => a.ordinal - b.ordinal);
    const skills = sortedCategorySelections.map(sel => {
      const category = categoryMap.get(sel.categoryId);
      if (!category) {
        throw new Error(`Skill category not found: ${sel.categoryId}`);
      }

      // Filter to selected items within this category, sorted by archetype ordinal
      const selectedItems = category.items
        .filter(item => selectedItemOrdinals.has(item.id.value))
        .sort((a, b) => (selectedItemOrdinals.get(a.id.value) ?? 0) - (selectedItemOrdinals.get(b.id.value) ?? 0));

      const info = selectedItems.map(item => item.skillName.replace(/#/g, '\\#')).join(' #h-bar() ');

      return {
        type: category.categoryName,
        info
      };
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
