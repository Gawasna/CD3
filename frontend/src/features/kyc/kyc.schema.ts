import { z } from 'zod';

export const submitKycSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  idNumber: z.string().min(1, 'ID number is required'),
  address: z.string().min(1, 'Address is required'),
  country: z.string().min(1, 'Country is required'),
  // Normally files are validated differently (e.g. instanceof File), 
  // but for Zod in a form, we can just ensure they exist.
  idFrontImage: z.any().refine((val) => val instanceof File || val instanceof Blob, 'Front ID image is required'),
  idBackImage: z.any().refine((val) => val instanceof File || val instanceof Blob, 'Back ID image is required'),
  selfieImage: z.any().refine((val) => val instanceof File || val instanceof Blob, 'Selfie image is required'),
});

export type SubmitKycData = z.infer<typeof submitKycSchema>;