import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LinkCompanySchema = z.object({
  company_id: z.string().uuid()
});

export class LinkCompanyDto extends createZodDto(LinkCompanySchema) {}
