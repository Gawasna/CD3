import { authFetch } from './client';

export interface KycSubmitPayload {
  fullName: string;
  idNumber: string;
  dateOfBirth: string; // ISO 8601
  address?: string;
  documentUrl?: string;
}

export const kycApi = {
  submitKyc: async (data: KycSubmitPayload) => {
    return authFetch<{ success: boolean; data: any }>('/v1/kyc', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
