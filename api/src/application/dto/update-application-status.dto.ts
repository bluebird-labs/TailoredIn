import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateApplicationStatusSchema = z.object({
  status: z.string().min(1),
  resume_content_id: z.string().uuid().optional(),
  archive_reason: z.string().min(1).optional(),
  withdraw_reason: z.string().min(1).optional()
});

export class UpdateApplicationStatusDto extends createZodDto(UpdateApplicationStatusSchema) {}
