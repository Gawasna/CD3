import { authFetch } from './client';

export interface KycRequestItem {
  id: string;
  userId: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  documentUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE';
  createdAt: string;
  user: {
    displayName: string | null;
    walletAddress: string;
    email?: string | null;
  };
}

export interface GetKycRequestsResponse {
  data: KycRequestItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminApi = {
  getKycRequests: async (page = 1, limit = 10, status = 'PENDING'): Promise<GetKycRequestsResponse> => {
    return authFetch<GetKycRequestsResponse>(`/v1/admin/kyc?page=${page}&limit=${limit}&status=${status}`);
  },

  approveKyc: async (kycId: string): Promise<any> => {
    return authFetch(`/v1/admin/kyc/${kycId}/approve`, {
      method: 'POST',
    });
  },

  rejectKyc: async (kycId: string, reason: string): Promise<any> => {
    return authFetch(`/v1/admin/kyc/${kycId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
