import { authFetch } from './client';
import { useAuthStore } from '../../store/auth.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface UserProfileParams {
  displayName?: string;
}

export const profileApi = {
  // Lấy thông tin profile
  getProfile: async () => {
    return authFetch<{ data: any }>('/users/me'); // Giả định response payload có .data, hoặc thay đổi tùy api
  },

  // Cập nhật thông tin text (Tên hiển thị)
  updateProfile: async (data: UserProfileParams) => {
    return authFetch<{ data: any }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Tải lên avatar (multipart/form-data)
  uploadAvatar: async (file: File) => {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch(`${API_BASE}/users/me/avatar`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Không truyền Content-Type để 브rowser tự thêm boundary cho multipart/form-data
      },
      body: formData,
    });

    if (res.status === 401) {
      useAuthStore.getState().clearAuth();
      throw new Error('SESSION_EXPIRED');
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
    }

    return res.json();
  }
};