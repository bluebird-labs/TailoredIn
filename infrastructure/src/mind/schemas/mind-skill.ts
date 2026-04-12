import { z } from 'zod';

export const MindSkillSchema = z.object({
  name: z.string().min(1),
  type: z.union([z.array(z.string()), z.string().transform(s => [s])]).default([]),
  synonyms: z.array(z.string()).default([]),
  technicalDomains: z.array(z.string()).default([]),
  impliesKnowingSkills: z.array(z.string()).default([]),
  impliesKnowingConcepts: z.array(z.string()).default([]),
  conceptualAspects: z.array(z.string()).default([]),
  architecturalPatterns: z.array(z.string()).default([]),
  supportedProgrammingLanguages: z.array(z.string()).default([]),
  specificToFrameworks: z.array(z.string()).default([]),
  adapterForToolOrService: z.array(z.string()).default([]),
  implementsPatterns: z.array(z.string()).default([]),
  associatedToApplicationDomains: z.array(z.string()).default([]),
  solvesApplicationTasks: z.array(z.string()).default([]),
  buildTools: z.array(z.string()).default([]),
  runtimeEnvironments: z.array(z.string()).default([])
});

export type MindSkill = z.infer<typeof MindSkillSchema>;
