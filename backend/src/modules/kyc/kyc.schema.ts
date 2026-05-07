import { z } from 'zod';

export const kycSubmitSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
  idNumber: z.string().min(9, 'ID number must be at least 9 characters').max(20, 'ID number is too long'),
  dateOfBirth: z.string().datetime({ message: 'Invalid date format, expected ISO 8601' }).or(z.date()),
  address: z.string().min(5, 'Address is too short').max(255, 'Address is too long').optional(),
  documentUrl: z.string().url('Invalid URL format').optional(),
});

export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;
