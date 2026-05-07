"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/services/api/profile';
import { useAuthStore } from '@/store/auth.store';
export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [kycStatus, setKycStatus] = useState('NONE');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const { _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    const fetchProfile = async () => {
      try {
        const res = await profileApi.getProfile();
        // Giả định res.data trả về user fields
        const user = (res as any).data || res;
        setDisplayName(user.displayName || '');
        setAvatarUrl(user.avatarUrl || '');
        setKycStatus(user.kycStatus || 'NONE');
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setIsPageLoading(false);
      }
    };
    
    fetchProfile();
  }, [_hasHydrated]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await profileApi.updateProfile({ displayName });
      alert('Cập nhật profile thành công!');
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await profileApi.uploadAvatar(file);
      const newAvatarUrl = (res as any).data?.avatarUrl || (res as any).avatarUrl;
      if (newAvatarUrl) {
         setAvatarUrl(newAvatarUrl);
      }
      alert('Tải ảnh đại diện thành công!');
    } catch (err: any) {
      alert(`Lỗi upload ảnh: ${err.message}`);
    }
  };

  const handleKycRedirect = () => {
    router.push('/kyc');
  };

  const showKycButton = kycStatus === 'NONE' || kycStatus === 'REJECTED';

  if (isPageLoading) {
    return <div className="p-10 text-center text-black">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-black">Quản lý Hồ sơ</h1>
      
      <form onSubmit={handleUpdateProfile} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Ảnh đại diện</label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full text-gray-400 flex items-center justify-center">No Img</div>
              )}
            </div>
            <label className="cursor-pointer px-4 py-2 border rounded-md text-sm hover:bg-gray-50 text-black">
              Tải ảnh lên
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} />
            </label>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Tên hiển thị</label>
          <input 
            type="text" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Nhập tên hiển thị..."
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Đang lưu...' : 'Lưu Thay đổi'}
        </button>
      </form>

      {/* KYC Section */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-black">Xác minh danh tính (KYC)</h2>
        <p className="mb-4 text-gray-600">Trạng thái: <span className="font-semibold text-black">{kycStatus}</span></p>
        
        {showKycButton && (
          <button 
            onClick={handleKycRedirect}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Yêu cầu xác minh KYC
          </button>
        )}
      </div>
    </div>
  );
}