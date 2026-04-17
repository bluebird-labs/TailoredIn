import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  about: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  github_url: z.string().nullable(),
  website_url: z.string().nullable()
});

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
