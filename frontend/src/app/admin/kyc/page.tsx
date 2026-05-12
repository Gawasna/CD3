'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api/admin';
import { CheckCircle, XCircle, Search, User as UserIcon, RefreshCw, Eye } from 'lucide-react';

export default function AdminKycDashboard() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedKycId, setSelectedKycId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-kyc', page, statusFilter],
    queryFn: () => adminApi.getKycRequests(page, 10, statusFilter),
    refetchOnWindowFocus: true,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveKyc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectKyc(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
      setSelectedKycId(null);
      setRejectReason('');
    },
  });

  const handleApprove = (id: string) => {
    if (window.confirm('Chấp nhận yêu cầu KYC này?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: string) => {
    if (!rejectReason) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    rejectMutation.mutate({ id, reason: rejectReason });
  };

  const handleViewDocument = (documentUrl: string | null) => {
    if (!documentUrl) {
      alert('Không có tài liệu để xem.');
      return;
    }
    // Mở document trong tab mới
    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${documentUrl}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 p-8 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jetbrains text-2xl font-bold text-[#111111]">KYC Management</h1>
          <p className="font-geist text-sm text-[#666666] mt-1">Review and manage user KYC requests</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#CBCCC9] rounded-full hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="font-geist text-sm font-medium">Refresh</span>
        </button>
      </div>

      <div className="flex gap-4">
        <select 
          className="px-4 py-2 rounded-lg border border-[#CBCCC9] bg-white font-geist text-sm outline-none focus:border-[#004D1A]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="flex flex-col w-full bg-white border border-[#CBCCC9] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#666666]">Loading KYC requests...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error loading data.</div>
        ) : data?.data.length === 0 ? (
          <div className="p-8 text-center text-[#666666]">No KYC requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#DFE6E1] text-[#004D1A] font-jetbrains text-sm border-b border-[#CBCCC9]">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">ID Number</th>
                  <th className="p-4 font-semibold">Submitted At</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Document</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((req) => (
                  <tr key={req.id} className="border-b border-[#CBCCC9] hover:bg-[#F9FAFB] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E7E8E5] flex items-center justify-center text-[#666666]">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-jetbrains font-medium text-[#111111]">{req.fullName}</p>
                          <p className="font-geist text-xs text-[#666666] truncate w-32">{req.user.walletAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-geist text-sm text-[#111111]">{req.idNumber}</td>
                    <td className="p-4 font-geist text-sm text-[#666666]">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        req.status === 'PENDING' ? 'bg-[#FEF3C7] text-[#92400E]' :
                        req.status === 'APPROVED' ? 'bg-[#D1FAE5] text-[#065F46]' :
                        'bg-[#FEE2E2] text-[#991B1B]'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.documentUrl ? (
                        <button 
                          onClick={() => handleViewDocument(req.documentUrl)}
                          className="flex items-center gap-2 px-3 py-1 text-sm text-[#004D1A] hover:bg-[#DFE6E1] rounded-lg transition-colors"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="font-geist">View ID</span>
                        </button>
                      ) : (
                        <span className="text-xs text-[#999999]">No document</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                          {selectedKycId === req.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                placeholder="Lý do từ chối..." 
                                className="px-3 py-1 text-sm border border-red-300 rounded focus:outline-none"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                              />
                              <button 
                                onClick={() => handleReject(req.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Xác nhận
                              </button>
                              <button 
                                onClick={() => setSelectedKycId(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleApprove(req.id)}
                                className="p-2 text-[#004D1A] hover:bg-[#D1FAE5] rounded-full transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedKycId(req.id);
                                  setRejectReason('');
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-[#CBCCC9] rounded-lg bg-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 font-geist text-[#666666]">
            Page {page} of {data.meta.totalPages}
          </span>
          <button 
            disabled={page === data.meta.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-[#CBCCC9] rounded-lg bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
