import { authFetch } from './client';

export interface KycSubmitData {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  address?: string;
  frontIdUrl: string;
  backIdUrl: string;
  selfieUrl: string;
}

export const kycApi = {
  submitKyc: async (data: KycSubmitData) => {
    return authFetch<{ success: boolean; data: any }>('/v1/kyc', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    
    return authFetch<{ success: boolean; data: { documentUrl: string; filename: string; size: number } }>('/v1/kyc/upload', {
      method: 'POST',
      body: formData,
    });
  },
};
