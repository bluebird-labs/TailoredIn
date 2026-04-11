import { ScopeRecipe } from '@tailoredin/application';
import { type GenerationContext, GenerationScope, ResumeConstraints } from '@tailoredin/domain';
import { z } from 'zod';
import type { BulletParamsSection } from './BulletParamsSection.js';
import type { CareerTimelineSection } from './CareerTimelineSection.js';
import type { CompanyContextSection } from './CompanyContextSection.js';
import type { EducationSection } from './EducationSection.js';
import type { ExperienceDetailSection } from './ExperienceDetailSection.js';
import type { HeadlineInstructionsSection } from './HeadlineInstructionsSection.js';
import type { JobDescriptionSection } from './JobDescriptionSection.js';
import type { OtherExperiencesSection } from './OtherExperiencesSection.js';
import type { OutputConstraintsSection } from './OutputConstraintsSection.js';
import type { ProfileSection } from './ProfileSection.js';
import type { RulesSection } from './RulesSection.js';
import type { SettingsSection } from './SettingsSection.js';
import type { ToneSection } from './ToneSection.js';
import type { UserInstructionsSection } from './UserInstructionsSection.js';

type AllSections = {
  rules: RulesSection;
  outputConstraints: OutputConstraintsSection;
  profile: ProfileSection;
  tone: ToneSection;
  companyContext: CompanyContextSection;
  education: EducationSection;
  settings: SettingsSection;
  jobDescription: JobDescriptionSection;
  experienceDetail: ExperienceDetailSection;
  otherExperiences: OtherExperiencesSection;
  userInstructions: UserInstructionsSection;
  bulletParams: BulletParamsSection;
  headlineInstructions: HeadlineInstructionsSection;
  careerTimeline: CareerTimelineSection;
};

const headlineOutputSchema = z.object({
  headline: z.string().min(ResumeConstraints.HEADLINE_MIN_LENGTH).max(ResumeConstraints.HEADLINE_MAX_LENGTH)
});

function createExperienceBulletsOutputSchema(bulletMin: number, bulletMax: number) {
  return z.object({
    summary: z.string().min(ResumeConstraints.SUMMARY_MIN_LENGTH).max(ResumeConstraints.SUMMARY_MAX_LENGTH),
    bullets: z
      .array(z.string().min(ResumeConstraints.BULLET_MIN_LENGTH).max(ResumeConstraints.BULLET_MAX_LENGTH))
      .min(bulletMin)
      .max(bulletMax)
  });
}

function experienceBulletsSchemaFactory(context: GenerationContext): unknown {
  const target = context.experiences[0];
  const bulletMin = target?.bulletMin ?? 1;
  const bulletMax = target?.bulletMax ?? 5;
  return createExperienceBulletsOutputSchema(bulletMin, bulletMax);
}

const experienceSummaryOutputSchema = z.object({
  summary: z.string().min(ResumeConstraints.SUMMARY_MIN_LENGTH).max(ResumeConstraints.SUMMARY_MAX_LENGTH)
});

const bulletOutputSchema = z.object({
  bullet: z.string().min(ResumeConstraints.BULLET_MIN_LENGTH).max(ResumeConstraints.BULLET_MAX_LENGTH)
});

export function createHeadlineRecipe(s: AllSections, model: string): ScopeRecipe {
  return new ScopeRecipe(
    GenerationScope.HEADLINE,
    [
      s.headlineInstructions,
      s.outputConstraints,
      s.profile,
      s.tone,
      s.education,
      s.settings,
      s.jobDescription,
      s.careerTimeline,
      s.userInstructions
    ],
    model,
    headlineOutputSchema
  );
}

export function createExperienceBulletsRecipe(s: AllSections, model: string): ScopeRecipe {
  return new ScopeRecipe(
    GenerationScope.EXPERIENCE,
    [
      s.rules,
      s.outputConstraints,
      s.profile,
      s.tone,
      s.companyContext,
      s.settings,
      s.jobDescription,
      s.experienceDetail,
      s.otherExperiences,
      s.userInstructions
    ],
    model,
    experienceBulletsSchemaFactory
  );
}

export function createExperienceSummaryRecipe(s: AllSections, model: string): ScopeRecipe {
  return new ScopeRecipe(
    GenerationScope.EXPERIENCE_SUMMARY,
    [
      s.rules,
      s.outputConstraints,
      s.profile,
      s.tone,
      s.companyContext,
      s.settings,
      s.jobDescription,
      s.experienceDetail,
      s.userInstructions
    ],
    model,
    experienceSummaryOutputSchema
  );
}

export function createBulletRecipe(s: AllSections, model: string): ScopeRecipe {
  return new ScopeRecipe(
    GenerationScope.BULLET,
    [
      s.rules,
      s.outputConstraints,
      s.profile,
      s.tone,
      s.companyContext,
      s.settings,
      s.jobDescription,
      s.experienceDetail,
      s.bulletParams,
      s.userInstructions
    ],
    model,
    bulletOutputSchema
  );
}
