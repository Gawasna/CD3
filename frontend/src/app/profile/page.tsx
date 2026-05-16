"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/services/api/profile';
import { useAuthStore } from '@/store/auth.store';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [lastAddressUpdate, setLastAddressUpdate] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState('NONE');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { _hasHydrated, updateUser } = useAuthStore();

  const { data: profileData, isLoading: isQueryLoading, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
    enabled: _hasHydrated,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (profileData) {
      const user = (profileData as any).user || (profileData as any).data || profileData;
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
      setAddress1(user.address1 || '');
      setAddress2(user.address2 || '');
      setLastAddressUpdate(user.lastAddressUpdate || null);
      setKycStatus(user.kycStatus || 'NONE');
      setIsPageLoading(false);
    } else if (!isQueryLoading && _hasHydrated) {
      setIsPageLoading(false);
    }
  }, [profileData, isQueryLoading, _hasHydrated]);

  const canUpdateAddress = () => {
    if (!lastAddressUpdate) return true;
    const lastUpdate = new Date(lastAddressUpdate);
    const now = new Date();
    const diffInMs = now.getTime() - lastUpdate.getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return diffInMs >= oneDayInMs;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = (profileData as any).user || (profileData as any).data || profileData;
      const updateData: any = { displayName };
      
      // Chỉ gửi address nếu nó thay đổi so với db
      if (address1 !== (user.address1 || '')) updateData.address1 = address1;
      if (address2 !== (user.address2 || '')) updateData.address2 = address2;

      await profileApi.updateProfile(updateData);
      updateUser({ displayName });
      await refetch();
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
      const newAvatarUrl = (res as any).user?.avatarUrl || (res as any).data?.avatarUrl || (res as any).avatarUrl;
      if (newAvatarUrl) {
         setAvatarUrl(newAvatarUrl);
         updateUser({ avatarUrl: newAvatarUrl });
      }
    } catch (err: any) {
      alert(`Lỗi upload ảnh: ${err.message}`);
    }
  };

  const handleKycRedirect = () => {
    router.push('/kyc');
  };

  const showKycButton = kycStatus === 'NONE' || kycStatus === 'REJECTED';

  if (isPageLoading) {
    return (
      <div className="flex h-[calc(100vh-72px)] items-center justify-center bg-[#F2F3F0]">
        <Loader2 className="w-8 h-8 text-[#FF8400] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#F2F3F0] flex justify-center py-12 px-6">
      <div className="w-full max-w-[800px] flex flex-col gap-8">
        
        <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">
          Quản lý Hồ sơ
        </h1>
        
        {/* Profile Form Card */}
        <form 
          onSubmit={handleUpdateProfile} 
          className="bg-white rounded-2xl p-8 lg:p-10 border border-[#CBCCC9] shadow-sm flex flex-col gap-8"
        >
          {/* Avatar Section */}
          <div className="flex flex-col gap-4">
            <label className="font-geist text-base font-semibold text-[#111111]">
              Ảnh đại diện
            </label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#CBCCC9] bg-gray-100 flex-shrink-0 flex items-center justify-center relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#666666] font-geist text-xs">Trống</span>
                )}
                {/* Overlay for hover */}
                <div 
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-lg border border-[#CBCCC9] text-[#111111] font-geist font-medium hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Tải ảnh lên
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleAvatarChange} 
              />
            </div>
          </div>

          {/* Display Name Section */}
          <div className="flex flex-col gap-4">
            <label className="font-geist text-base font-semibold text-[#111111]">
              Tên hiển thị
            </label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-[#CBCCC9] rounded-lg focus:border-[#FF8400] focus:ring-1 focus:ring-[#FF8400] outline-none text-[#111111] font-geist placeholder:text-[#666666] transition-all"
              placeholder="Nhập tên hiển thị..."
            />
          </div>

          {/* Address 1 Section */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="font-geist text-base font-semibold text-[#111111]">
                Địa chỉ 1
              </label>
              {!canUpdateAddress() && (
                <span className="text-xs text-[#EF4444] font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Có thể cập nhật sau 24h
                </span>
              )}
            </div>
            <input 
              type="text" 
              value={address1}
              disabled={!canUpdateAddress()}
              onChange={(e) => setAddress1(e.target.value)}
              className="w-full px-4 py-3 border border-[#CBCCC9] rounded-lg focus:border-[#FF8400] focus:ring-1 focus:ring-[#FF8400] outline-none text-[#111111] font-geist placeholder:text-[#666666] transition-all disabled:bg-[#F2F3F0] disabled:cursor-not-allowed"
              placeholder="Nhập địa chỉ 1..."
            />
          </div>

          {/* Address 2 Section */}
          <div className="flex flex-col gap-4">
            <label className="font-geist text-base font-semibold text-[#111111]">
              Địa chỉ 2
            </label>
            <input 
              type="text" 
              value={address2}
              disabled={!canUpdateAddress()}
              onChange={(e) => setAddress2(e.target.value)}
              className="w-full px-4 py-3 border border-[#CBCCC9] rounded-lg focus:border-[#FF8400] focus:ring-1 focus:ring-[#FF8400] outline-none text-[#111111] font-geist placeholder:text-[#666666] transition-all disabled:bg-[#F2F3F0] disabled:cursor-not-allowed"
              placeholder="Nhập địa chỉ 2..."
            />
          </div>

          {/* Action */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3 bg-[#FF8400] text-white rounded-lg font-geist font-semibold hover:bg-[#e67600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu Thay đổi'
              )}
            </button>
          </div>
        </form>

        {/* KYC Section */}
        <div className="bg-[#111111] rounded-2xl p-8 lg:p-10 border border-[#CBCCC9] flex flex-col gap-6 text-white shadow-lg relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF8400]/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-2">
            <h2 className="font-jetbrains text-2xl font-bold">Xác minh danh tính (KYC)</h2>
            <p className="text-[#CBCCC9] font-geist text-sm max-w-lg">
              Hoàn tất quy trình KYC để mở khóa tất cả các tính năng đấu giá và giao dịch trên nền tảng.
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-3">
            <span className="font-geist text-base text-[#CBCCC9]">Trạng thái hiện tại:</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${
              kycStatus === 'APPROVED' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 
              kycStatus === 'PENDING' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' :
              kycStatus === 'REJECTED' ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20' :
              'bg-white/10 text-white border-white/20'
            }`}>
              {kycStatus === 'APPROVED' && <CheckCircle2 className="w-4 h-4" />}
              {kycStatus === 'REJECTED' && <AlertCircle className="w-4 h-4" />}
              {kycStatus}
            </div>
          </div>
          
          {showKycButton && (
            <div className="relative z-10 pt-2">
              <button 
                onClick={handleKycRedirect}
                className="px-6 py-3 bg-white text-[#111111] rounded-lg font-geist font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                Yêu cầu xác minh KYC ngay
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}