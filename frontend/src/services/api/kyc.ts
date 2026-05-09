import { authFetch } from './client';

export const kycApi = {
  submitKyc: async (data: FormData) => {
    return authFetch<{ success: boolean; data: any }>('/v1/kyc', {
      method: 'POST',
      body: data,
    });
  },
};
