import { describe, expect, test } from 'bun:test';
import {
  Archetype,
  ArchetypeConfig,
  type ArchetypeConfigRepository,
  ArchetypeEducationSelection,
  ArchetypePosition,
  ArchetypePositionBulletRef,
  ArchetypeSkillCategorySelection,
  ArchetypeSkillItemSelection,
  ResumeBullet,
  ResumeCompany,
  type ResumeCompanyRepository,
  ResumeEducation,
  type ResumeEducationRepository,
  ResumeHeadline,
  type ResumeHeadlineRepository,
  ResumeLocation,
  ResumeSkillCategory,
  type ResumeSkillCategoryRepository,
  ResumeSkillItem,
  User,
  type UserRepository
} from '@tailoredin/domain';
import { DatabaseResumeContentFactory } from '../../src/services/DatabaseResumeContentFactory.js';

// --- Test fixtures ---

const USER_ID = 'user-1';

const makeUser = () =>
  User.create({
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    phoneNumber: '+1 555 123 4567',
    githubHandle: 'janedoe',
    linkedinHandle: 'jane-doe',
    locationLabel: 'New York, NY'
  });

const makeHeadline = () =>
  ResumeHeadline.create({
    userId: USER_ID,
    headlineLabel: 'Lead IC',
    summaryText: 'Experienced engineer building data-intensive products.'
  });

const makeBullet = (companyId: string, content: string, ordinal: number) =>
  ResumeBullet.create({ resumeCompanyId: companyId, content, ordinal });

const makeCompany = () => {
  const bullets = [
    makeBullet('tmp', 'Built a scalable API platform', 0),
    makeBullet('tmp', 'Led migration to microservices', 1),
    makeBullet('tmp', 'Improved CI/CD pipeline speed by 3x', 2)
  ];
  return ResumeCompany.create({
    userId: USER_ID,
    companyName: 'Acme Corp',
    companyMention: 'contract',
    websiteUrl: 'https://acme.com',
    businessDomain: 'B2B SaaS',
    joinedAt: '2023-01',
    leftAt: '2024-06',
    promotedAt: null,
    locations: [new ResumeLocation('New York, NY', 0)],
    bullets
  });
};

const makeEducation = () =>
  ResumeEducation.create({
    userId: USER_ID,
    degreeTitle: 'B.S. in Computer Science',
    institutionName: 'MIT',
    graduationYear: '2015',
    locationLabel: 'Cambridge, MA',
    ordinal: 0
  });

const makeSkillCategory = () => {
  const items = [
    ResumeSkillItem.create({ categoryId: 'tmp', skillName: 'TypeScript', ordinal: 0 }),
    ResumeSkillItem.create({ categoryId: 'tmp', skillName: 'Node.js', ordinal: 1 }),
    ResumeSkillItem.create({ categoryId: 'tmp', skillName: 'C#', ordinal: 2 })
  ];
  return ResumeSkillCategory.create({
    userId: USER_ID,
    categoryName: 'Backend',
    ordinal: 0,
    items
  });
};

const makeArchetypeConfig = (
  company: ResumeCompany,
  education: ResumeEducation,
  category: ResumeSkillCategory,
  headline: ResumeHeadline
) => {
  const position = ArchetypePosition.create({
    archetypeId: 'tmp',
    resumeCompanyId: company.id.value,
    jobTitle: 'Staff Software Engineer',
    displayCompanyName: 'Acme Corp #smallcaps[(contract)]',
    locationLabel: 'New York, NY',
    startDate: '2023-01',
    endDate: '2024-06',
    roleSummary: 'Led platform team building scalable APIs',
    ordinal: 0,
    bullets: [
      new ArchetypePositionBulletRef(company.bullets[0].id.value, 0),
      new ArchetypePositionBulletRef(company.bullets[1].id.value, 1)
    ]
  });

  return ArchetypeConfig.create({
    userId: USER_ID,
    archetypeKey: Archetype.LEAD_IC,
    archetypeLabel: 'Lead IC',
    archetypeDescription: null,
    headlineId: headline.id.value,
    socialNetworks: ['GitHub', 'LinkedIn'],
    positions: [position],
    educationSelections: [new ArchetypeEducationSelection(education.id.value, 0)],
    skillCategorySelections: [new ArchetypeSkillCategorySelection(category.id.value, 0)],
    skillItemSelections: [
      new ArchetypeSkillItemSelection(category.items[0].id.value, 0),
      new ArchetypeSkillItemSelection(category.items[1].id.value, 1)
      // C# intentionally excluded
    ]
  });
};

// --- Mock repositories ---

const mockUserRepo = (user: User): UserRepository => ({
  findByIdOrFail: async () => user,
  findSingle: async () => user,
  save: async () => {}
});

const mockHeadlineRepo = (headline: ResumeHeadline): ResumeHeadlineRepository => ({
  findByIdOrFail: async () => headline,
  findAllByUserId: async () => [headline],
  save: async () => {},
  delete: async () => {}
});

const mockArchetypeConfigRepo = (config: ArchetypeConfig | null): ArchetypeConfigRepository => ({
  findByIdOrFail: async () => config!,
  findByUserAndKey: async () => config,
  findAllByUserId: async () => (config ? [config] : []),
  save: async () => {},
  delete: async () => {}
});

const mockCompanyRepo = (companies: ResumeCompany[]): ResumeCompanyRepository => ({
  findByIdOrFail: async () => companies[0],
  findAllByUserId: async () => companies,
  save: async () => {},
  delete: async () => {}
});

const mockEducationRepo = (entries: ResumeEducation[]): ResumeEducationRepository => ({
  findAllByUserId: async () => entries,
  save: async () => {},
  delete: async () => {}
});

const mockSkillCategoryRepo = (categories: ResumeSkillCategory[]): ResumeSkillCategoryRepository => ({
  findByIdOrFail: async () => categories[0],
  findAllByUserId: async () => categories,
  save: async () => {},
  delete: async () => {}
});

// --- Tests ---

describe('DatabaseResumeContentFactory', () => {
  const setupFactory = () => {
    const user = makeUser();
    const headline = makeHeadline();
    const company = makeCompany();
    const education = makeEducation();
    const category = makeSkillCategory();
    const config = makeArchetypeConfig(company, education, category, headline);

    const factory = new DatabaseResumeContentFactory(
      mockUserRepo(user),
      mockHeadlineRepo(headline),
      mockArchetypeConfigRepo(config),
      mockCompanyRepo([company]),
      mockEducationRepo([education]),
      mockSkillCategoryRepo([category])
    );

    return { factory, user, headline, company, education, category, config };
  };

  const makeInput = () => ({
    userId: USER_ID,
    archetype: Archetype.LEAD_IC,
    awesomeColor: '#178FEA',
    keywords: ['TypeScript', 'Node.js']
  });

  test('maps personal data from User and Headline', async () => {
    const { factory } = setupFactory();
    const result = await factory.make(makeInput());

    expect(result.personal.first_name).toBe('Jane');
    expect(result.personal.last_name).toBe('Doe');
    expect(result.personal.email).toBe('jane@example.com');
    expect(result.personal.phone).toBe('+1 555 123 4567');
    expect(result.personal.github).toBe('janedoe');
    expect(result.personal.linkedin).toBe('jane-doe');
    expect(result.personal.location).toBe('New York, NY');
    expect(result.personal.header_quote).toBe('Experienced engineer building data-intensive products.');
  });

  test('passes through awesome_color and keywords', async () => {
    const { factory } = setupFactory();
    const result = await factory.make(makeInput());

    expect(result.awesome_color).toBe('#178FEA');
    expect(result.keywords).toEqual(['TypeScript', 'Node.js']);
  });

  test('maps experience from archetype positions with formatted dates', async () => {
    const { factory } = setupFactory();
    const result = await factory.make(makeInput());

    expect(result.experience).toHaveLength(1);
    const exp = result.experience[0];
    expect(exp.title).toBe('Staff Software Engineer');
    expect(exp.society).toBe('Acme Corp #smallcaps[(contract)]');
    expect(exp.date).toBe('Jan 2023 – Jun 2024');
    expect(exp.location).toBe('New York, NY');
    expect(exp.summary).toBe('Led platform team building scalable APIs');
  });

  test('resolves bullet content and ensures period at end', async () => {
    const { factory } = setupFactory();
    const result = await factory.make(makeInput());

    expect(result.experience[0].highlights).toHaveLength(2);
    expect(result.experience[0].highlights[0]).toBe('Built a scalable API platform.');
    expect(result.experience[0].highlights[1]).toBe('Led migration to microservices.');
  });

  test('maps education from archetype selections', async () => {
    const { factory } = setupFactory();
    const result = await factory.make(makeInput());

    expect(result.education).toHaveLength(1);
    expect(result.education[0].title).toBe('B.S. in Computer Science');
    expect(result.education[0].society).toBe('MIT');
    expect(result.education[0].date).toBe('2015');
    expect(result.education[0].location).toBe('Cambridge, MA');
  });

  test('maps skills with selected items only, joined with #h-bar()', async () => {
    const { factory } = setupFactory();
    const result = await factory.make(makeInput());

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].type).toBe('Backend');
    // C# is excluded (not in skillItemSelections), only TypeScript and Node.js
    expect(result.skills[0].info).toBe('TypeScript #h-bar() Node.js');
  });

  test('escapes # in skill names', async () => {
    const category = ResumeSkillCategory.create({
      userId: USER_ID,
      categoryName: 'Languages',
      ordinal: 0,
      items: [ResumeSkillItem.create({ categoryId: 'tmp', skillName: 'C#', ordinal: 0 })]
    });
    const headline = makeHeadline();
    const company = makeCompany();
    const education = makeEducation();

    const config = ArchetypeConfig.create({
      userId: USER_ID,
      archetypeKey: Archetype.LEAD_IC,
      archetypeLabel: 'Lead IC',
      archetypeDescription: null,
      headlineId: headline.id.value,
      socialNetworks: [],
      positions: [],
      educationSelections: [],
      skillCategorySelections: [new ArchetypeSkillCategorySelection(category.id.value, 0)],
      skillItemSelections: [new ArchetypeSkillItemSelection(category.items[0].id.value, 0)]
    });

    const factory = new DatabaseResumeContentFactory(
      mockUserRepo(makeUser()),
      mockHeadlineRepo(headline),
      mockArchetypeConfigRepo(config),
      mockCompanyRepo([company]),
      mockEducationRepo([education]),
      mockSkillCategoryRepo([category])
    );

    const result = await factory.make(makeInput());
    expect(result.skills[0].info).toBe('C\\#');
  });

  test('throws when archetype config not found', async () => {
    const factory = new DatabaseResumeContentFactory(
      mockUserRepo(makeUser()),
      mockHeadlineRepo(makeHeadline()),
      mockArchetypeConfigRepo(null),
      mockCompanyRepo([]),
      mockEducationRepo([]),
      mockSkillCategoryRepo([])
    );

    expect(factory.make(makeInput())).rejects.toThrow('ArchetypeConfig not found');
  });

  test('throws when bullet reference not found', async () => {
    const headline = makeHeadline();
    const education = makeEducation();
    const category = makeSkillCategory();

    // Position references a bullet that doesn't exist in any company
    const position = ArchetypePosition.create({
      archetypeId: 'tmp',
      resumeCompanyId: 'company-1',
      jobTitle: 'Engineer',
      displayCompanyName: 'Acme',
      locationLabel: 'NYC',
      startDate: '2023-01',
      endDate: '2024-01',
      roleSummary: 'Test',
      ordinal: 0,
      bullets: [new ArchetypePositionBulletRef('nonexistent-bullet', 0)]
    });

    const config = ArchetypeConfig.create({
      userId: USER_ID,
      archetypeKey: Archetype.LEAD_IC,
      archetypeLabel: 'Lead IC',
      archetypeDescription: null,
      headlineId: headline.id.value,
      socialNetworks: [],
      positions: [position],
      educationSelections: [],
      skillCategorySelections: [],
      skillItemSelections: []
    });

    const factory = new DatabaseResumeContentFactory(
      mockUserRepo(makeUser()),
      mockHeadlineRepo(headline),
      mockArchetypeConfigRepo(config),
      mockCompanyRepo([]), // No companies, so no bullets
      mockEducationRepo([education]),
      mockSkillCategoryRepo([category])
    );

    expect(factory.make(makeInput())).rejects.toThrow('Bullet not found: nonexistent-bullet');
  });

  test('handles nullable user fields gracefully', async () => {
    const user = User.create({
      email: 'minimal@example.com',
      firstName: 'Min',
      lastName: 'User',
      phoneNumber: null,
      githubHandle: null,
      linkedinHandle: null,
      locationLabel: null
    });

    const headline = makeHeadline();
    const company = makeCompany();
    const education = makeEducation();
    const category = makeSkillCategory();
    const config = makeArchetypeConfig(company, education, category, headline);

    const factory = new DatabaseResumeContentFactory(
      mockUserRepo(user),
      mockHeadlineRepo(headline),
      mockArchetypeConfigRepo(config),
      mockCompanyRepo([company]),
      mockEducationRepo([education]),
      mockSkillCategoryRepo([category])
    );

    const result = await factory.make(makeInput());
    expect(result.personal.phone).toBe('');
    expect(result.personal.github).toBe('');
    expect(result.personal.linkedin).toBe('');
    expect(result.personal.location).toBe('');
  });

  test('sorts positions by ordinal', async () => {
    const headline = makeHeadline();
    const company = makeCompany();
    const education = makeEducation();
    const category = makeSkillCategory();

    const pos1 = ArchetypePosition.create({
      archetypeId: 'tmp',
      resumeCompanyId: company.id.value,
      jobTitle: 'Second Position',
      displayCompanyName: 'Acme',
      locationLabel: 'NYC',
      startDate: '2021-01',
      endDate: '2022-01',
      roleSummary: 'Second',
      ordinal: 1,
      bullets: [new ArchetypePositionBulletRef(company.bullets[0].id.value, 0)]
    });

    const pos0 = ArchetypePosition.create({
      archetypeId: 'tmp',
      resumeCompanyId: company.id.value,
      jobTitle: 'First Position',
      displayCompanyName: 'Acme',
      locationLabel: 'NYC',
      startDate: '2023-01',
      endDate: '2024-01',
      roleSummary: 'First',
      ordinal: 0,
      bullets: [new ArchetypePositionBulletRef(company.bullets[1].id.value, 0)]
    });

    // Deliberately pass in reverse order
    const config = ArchetypeConfig.create({
      userId: USER_ID,
      archetypeKey: Archetype.LEAD_IC,
      archetypeLabel: 'Lead IC',
      archetypeDescription: null,
      headlineId: headline.id.value,
      socialNetworks: [],
      positions: [pos1, pos0],
      educationSelections: [],
      skillCategorySelections: [],
      skillItemSelections: []
    });

    const factory = new DatabaseResumeContentFactory(
      mockUserRepo(makeUser()),
      mockHeadlineRepo(headline),
      mockArchetypeConfigRepo(config),
      mockCompanyRepo([company]),
      mockEducationRepo([education]),
      mockSkillCategoryRepo([category])
    );

    const result = await factory.make(makeInput());
    expect(result.experience[0].title).toBe('First Position');
    expect(result.experience[1].title).toBe('Second Position');
  });
});
