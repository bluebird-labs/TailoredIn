import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateCompanySchema = z.object({
  name: z.string().min(1),
  domain_name: z.string().min(1),
  description: z.string().nullish(),
  website: z.string().nullish(),
  logo_url: z.string().nullish(),
  linkedin_link: z.string().nullish(),
  business_type: z.string().nullish(),
  industry: z.string().nullish(),
  stage: z.string().nullish(),
  status: z.string().nullish()
});

export class UpdateCompanyDto extends createZodDto(UpdateCompanySchema) {}
