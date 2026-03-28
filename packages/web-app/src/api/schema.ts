import * as z from "zod";


export const AffinitySchema = z.enum([
  "avoid",
  "expert",
]);
export type Affinity = z.infer<typeof AffinitySchema>;

export const CompanySchema = z.object({
  "id": z.string(),
  "createdAt": z.coerce.date(),
  "updatedAt": z.coerce.date(),
  "name": z.string(),
  "website": z.null(),
  "logoUrl": z.string(),
  "linkedinLink": z.string(),
  "ignored": z.boolean(),
});
export type Company = z.infer<typeof CompanySchema>;

export const MatchSchema = z.object({
  "id": z.string(),
  "createdAt": z.coerce.date(),
  "updatedAt": z.coerce.date(),
  "name": z.string(),
  "key": z.string(),
  "affinity": AffinitySchema,
  "variants": z.array(z.string()),
});
export type Match = z.infer<typeof MatchSchema>;

export const StatusUpdateSchema = z.object({
  "id": z.string(),
  "createdAt": z.coerce.date(),
  "updatedAt": z.coerce.date(),
  "job": z.string(),
  "status": z.string(),
});
export type StatusUpdate = z.infer<typeof StatusUpdateSchema>;

export const AvoidSchema = z.object({
  "score": z.number(),
  "matches": z.array(MatchSchema),
});
export type Avoid = z.infer<typeof AvoidSchema>;

export const SkillsSchema = z.object({
  "total": AvoidSchema,
  "expert": AvoidSchema,
  "interest": AvoidSchema,
  "avoid": AvoidSchema,
});
export type Skills = z.infer<typeof SkillsSchema>;

export const ScoresSchema = z.object({
  "salary": z.number(),
  "skills": SkillsSchema,
});
export type Scores = z.infer<typeof ScoresSchema>;

export const JobSchema = z.object({
  "id": z.string(),
  "statusUpdates": z.array(StatusUpdateSchema),
  "createdAt": z.coerce.date(),
  "updatedAt": z.coerce.date(),
  "status": z.string(),
  "applyLink": z.null(),
  "linkedinId": z.string(),
  "title": z.string(),
  "linkedinLink": z.string(),
  "type": z.string(),
  "level": z.null(),
  "remote": z.string(),
  "postedAt": z.coerce.date(),
  "isRepost": z.boolean(),
  "locationRaw": z.string(),
  "salaryLow": z.number(),
  "salaryHigh": z.number(),
  "salaryRaw": z.string(),
  "description": z.string(),
  "descriptionHtml": z.string(),
  "applicantsCount": z.null(),
  "company": CompanySchema,
  "scores": ScoresSchema,
});
export type Job = z.infer<typeof JobSchema>;
