import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DiscoverCompaniesSchema = z.object({
  query: z.string().min(1)
});

export class DiscoverCompaniesDto extends createZodDto(DiscoverCompaniesSchema) {}
