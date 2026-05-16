import { z } from 'zod';

export const updateProfileBodySchema = z.object({
  displayName: z
    .string()
    .min(1, 'displayName cannot be empty')
    .max(50, 'displayName max 50 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('avatarUrl must be a valid URL')
    .optional(),
  address1: z
    .string()
    .max(255, 'address1 max 255 characters')
    .optional(),
  address2: z
    .string()
    .max(255, 'address2 max 255 characters')
    .optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
