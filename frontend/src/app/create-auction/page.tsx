'use client';

import { useState, useRef, DragEvent, FormEvent, useEffect } from 'react';
import { Upload, Check, X, Video, AlertCircle, Info, Loader2 } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useRouter } from 'next/navigation';
import { uploadAuctionMedia, createAuction, type AuctionCategory, type ShippingPayer } from '@/services/api/auction';
import { fetchMe } from '@/services/api/auth';
import { useQuery } from '@tanstack/react-query';
import AuctionPlatformABI from '@/services/blockchain/abi/AuctionPlatform.json';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/auth/ToastContainer';
import TransactionDialog from '@/components/shared/TransactionDialog';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function CreateAuction() {
  const router = useRouter();
  const { showToast } = useToast();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { user, _hasHydrated, token, updateUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Fetch latest user info to ensure KYC status is up to date
  const { data: latestUser, isLoading: isFetchingMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => fetchMe(token!),
    enabled: !!token && _hasHydrated,
    staleTime: 0,
  });

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AuctionCategory>('ELECTRONICS');
  const [startingPrice, setStartingPrice] = useState('0.000000');
  const [hasBuyNow, setHasBuyNow] = useState(false);
  const [buyNowPrice, setBuyNowPrice] = useState('0.000000');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('86400'); // 1 day in seconds
  const [shippingCost, setShippingCost] = useState('0.000000');
  const [shippingPayer, setShippingPayer] = useState<ShippingPayer>('BUYER');

  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess: isTxConfirmed, isLoading: isTxConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [uploadedFilenames, setUploadedFilenames] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<'uploading' | 'waiting_wallet' | 'confirming' | 'finalizing' | 'error' | 'success'>('uploading');

  // ── Effects (Must be unconditional) ──────────────────────────────────

  // Update store when fresh data arrives
  useEffect(() => {
    if (latestUser) {
      updateUser(latestUser);
    }
  }, [latestUser, updateUser]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not connected
  useEffect(() => {
    if (mounted && _hasHydrated && !isConnecting && !isReconnecting && !isConnected) {
      router.push('/');
    }
  }, [isConnected, isConnecting, isReconnecting, mounted, _hasHydrated, router]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isTxConfirmed && txHash && uploadedFilenames.length > 0 && isCreating) {
      const registerAuction = async () => {
        try {
          setError(null);
          const { auctionId } = await createAuction({
            title,
            description,
            category,
            startingPriceWei: parseEther(startingPrice).toString(),
            buyNowPriceWei: (hasBuyNow && buyNowPrice) ? parseEther(buyNowPrice).toString() : undefined,
            startTime: startTime ? new Date(startTime).toISOString() : undefined,
            durationSeconds: parseInt(duration),
            shippingCostWei: parseEther(shippingCost).toString(),
            shippingPayer,
            createTxHash: txHash,
            mediaKeys: uploadedFilenames,
          });

          showToast('success', 'Auction created successfully!');
          router.push(`/auctions/${auctionId}`);
        } catch (error: any) {
          console.error('Error registering auction:', error);
          const msg = `Transaction confirmed but failed to register: ${error.message}`;
          setError(msg);
          setDialogStatus('error');
          setIsCreating(false);
        }
      };
      
      registerAuction();
    }
  }, [isTxConfirmed, txHash, uploadedFilenames, isCreating, title, description, category, startingPrice, buyNowPrice, hasBuyNow, duration, shippingCost, shippingPayer, router, showToast]);

  // Sync dialog status with transaction receipt
  useEffect(() => {
    if (isTxConfirmed) {
      setDialogStatus('finalizing');
    }
  }, [isTxConfirmed]);

  // Handle final redirection & status
  useEffect(() => {
    if (isTxConfirmed && !error && dialogStatus === 'finalizing') {
      const timer = setTimeout(() => {
        setDialogStatus('success');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isTxConfirmed, error, dialogStatus]);

  // ── Component Logic ──────────────────────────────────────────────────

  const isKycApproved = (latestUser?.kycStatus || user?.kycStatus) === 'APPROVED';

  // If not ready, show loading (Must be after all hooks)
  if (!mounted || !_hasHydrated || isConnecting || isReconnecting || (!!token && isFetchingMe)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F2F3F0]">
        <div className="animate-pulse font-jetbrains text-[#FF8400]">Loading authentication state...</div>
      </div>
    );
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const videoTypes = ['video/mp4', 'video/quicktime'];
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB

    if (imageTypes.includes(file.type)) {
      if (file.size > maxImageSize) return { valid: false, error: 'Image must be less than 5MB' };
      return { valid: true };
    } else if (videoTypes.includes(file.type)) {
      if (file.size > maxVideoSize) return { valid: false, error: 'Video must be less than 50MB' };
      return { valid: true };
    } else {
      return { valid: false, error: 'Only JPG, PNG, MP4, and MOV files are allowed' };
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newMediaFiles: MediaFile[] = [];
    Array.from(files).forEach((file) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        showToast('warning', validation.error || 'Invalid file');
        return;
      }
      if (mediaFiles.length + newMediaFiles.length >= 6) {
        showToast('warning', 'Maximum 6 media files allowed');
        return;
      }
      const preview = URL.createObjectURL(file);
      newMediaFiles.push({ file, preview, type: file.type.startsWith('image/') ? 'image' : 'video' });
    });
    setMediaFiles((prev) => [...prev, ...newMediaFiles]);
  };

  const removeFile = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConnected || !address) return showToast('error', 'Please connect your wallet first');
    if (!isKycApproved) return showToast('error', 'You must complete KYC verification to create auctions.');
    if (mediaFiles.length === 0) return showToast('error', 'Please upload at least one media file');
    if (title.length < 10) return showToast('error', 'Title must be at least 10 characters');
    if (description.length < 20) return showToast('error', 'Description must be at least 20 characters');

    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress || contractAddress === '0x') throw new Error('Contract address not configured');

      setIsDialogOpen(true);
      setDialogStatus('uploading');
      setIsUploading(true);

      const firstImageIndex = mediaFiles.findIndex(m => m.type === 'image');
      let currentMediaFiles = [...mediaFiles];
      if (firstImageIndex > 0) {
        const firstImage = currentMediaFiles.splice(firstImageIndex, 1)[0];
        currentMediaFiles.unshift(firstImage);
      }

      const { filenames } = await uploadAuctionMedia(currentMediaFiles.map((m) => m.file));
      setUploadedFilenames(filenames);
      setIsUploading(false);

      setDialogStatus('waiting_wallet');
      setIsCreating(true);
      
      const now = Math.floor(Date.now() / 1000);
      let startTimestamp = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : now;
      if (startTimestamp <= now) startTimestamp = now + 30;

      const startingPriceWei = parseEther(startingPrice);
      const buyNowPriceWei = (hasBuyNow && buyNowPrice) ? parseEther(buyNowPrice) : 0n;
      
      const collateralBps = 1000n;
      const calcCollateral = (startingPriceWei * collateralBps) / 10000n;
      const minCollateral = parseEther('0.0001');
      const requiredCollateral = calcCollateral > minCollateral ? calcCollateral : minCollateral;

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: AuctionPlatformABI.abi,
        functionName: 'createAuction',
        args: [startingPriceWei, BigInt(startTimestamp), BigInt(duration), JSON.stringify(filenames), buyNowPriceWei, shippingPayer === 'BUYER' ? 0 : 1],
        value: requiredCollateral,
      }, {
        onSuccess: () => setDialogStatus('confirming'),
        onError: (error: any) => {
          setError(error.shortMessage || error.message);
          setDialogStatus('error');
          setIsCreating(false);
        }
      });
    } catch (error: any) {
      setError(error.message);
      setDialogStatus('error');
      setIsUploading(false);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-16 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <TransactionDialog 
        isOpen={isDialogOpen}
        status={dialogStatus}
        error={error || undefined}
        onClose={() => {
          setIsDialogOpen(false);
          if (dialogStatus === 'error') setError(null);
        }}
        onRetry={() => {
          setIsDialogOpen(false);
          setError(null);
          // Manually call submit logic without event
          handleSubmit({ preventDefault: () => {} } as any);
        }}
      />
      <div className="flex flex-col gap-12 w-full max-w-[800px]">
        <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">Create New Auction</h1>
        
        {!isKycApproved && (
          <div className="flex items-start gap-3 p-4 bg-[#FFF3CD] border border-[#FFC107] rounded-2xl">
            <AlertCircle className="w-5 h-5 text-[#856404] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <p className="font-jetbrains text-sm font-semibold text-[#856404]">KYC Verification Required</p>
              <p className="font-geist text-sm text-[#856404]">You must complete KYC verification before creating auctions. <a href="/kyc" className="underline ml-1 hover:text-[#FF8400]">Complete KYC now</a></p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-[#F8D7DA] border border-[#F5C2C7] rounded-2xl">
            <AlertCircle className="w-5 h-5 text-[#842029] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <p className="font-jetbrains text-sm font-semibold text-[#842029]">Error</p>
              <p className="font-geist text-sm text-[#842029]">{error}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 bg-white border border-[#CBCCC9] rounded-2xl p-12 shadow-sm w-full">
          <div className="flex flex-col gap-4 w-full">
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
            <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
              className={`flex flex-col items-center justify-center gap-4 h-[200px] w-full border border-dashed rounded-2xl cursor-pointer transition-colors ${isDragging ? 'bg-[#FFE5CC] border-[#FF8400]' : 'bg-[#E7E8E5] border-[#CBCCC9] hover:bg-[#DFE0DD]'}`}
            >
              <Upload className="w-8 h-8 text-[#666666]" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-geist text-sm text-[#666666]">Click or Drag & Drop to Upload Media</span>
                <span className="font-geist text-xs text-[#999999]">JPG, PNG, MP4, MOV • Max 6 files</span>
              </div>
            </div>

            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-4 w-full">
                {mediaFiles.map((media, index) => (
                  <div key={index} className="relative aspect-square bg-[#E7E8E5] rounded-xl overflow-hidden border border-[#CBCCC9] group">
                    {media.type === 'image' ? <img src={media.preview} className="w-full h-full object-cover" /> : <div className="relative w-full h-full"><video src={media.preview} className="w-full h-full object-cover" /><div className="absolute inset-0 flex items-center justify-center bg-black/20"><Video className="w-8 h-8 text-white" /></div></div>}
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="absolute top-2 right-2 w-6 h-6 bg-[#111111] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF8400]"><X className="w-4 h-4 text-white" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Item Name *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={10} className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" placeholder="e.g. Vintage Camera (min 10 characters)" />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as AuctionCategory)} required className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist bg-white w-full appearance-none">
              <option value="ELECTRONICS">Electronics</option>
              <option value="FASHION">Fashion & Accessories</option>
              <option value="FURNITURE">Furniture</option>
              <option value="COLLECTIBLES">Collectibles</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Description & Details *</label>
            <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required minLength={20} className="p-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist resize-none w-full" placeholder="Describe your item in detail (min 20 characters)..." />
          </div>

          <div className="flex gap-6 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-jetbrains text-sm font-semibold text-[#111111]">Start Time</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-jetbrains text-sm font-semibold text-[#111111]">Duration *</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} required className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist bg-white w-full">
                <option value="3600">1 Hour (Test)</option>
                <option value="86400">1 Day</option>
                <option value="604800">7 Days</option>
              </select>
            </div>
          </div>

          <div className="flex gap-6 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-jetbrains text-sm font-semibold text-[#111111]">Starting Price (ETH) *</label>
              <input type="number" step="0.000001" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} required min="0.000001" className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" placeholder="0.000000" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between">
                <label className="font-jetbrains text-sm font-semibold text-[#111111]">Buy Now Price (ETH)</label>
                <input type="checkbox" checked={hasBuyNow} onChange={(e) => setHasBuyNow(e.target.checked)} />
              </div>
              <input type="number" step="0.000001" value={buyNowPrice} onChange={(e) => setBuyNowPrice(e.target.value)} disabled={!hasBuyNow} className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" placeholder={hasBuyNow ? "0.000000" : "Disabled"} />
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Shipping Paid By *</label>
            <select value={shippingPayer} onChange={(e) => setShippingPayer(e.target.value as ShippingPayer)} required className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist bg-white w-full">
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
            </select>
          </div>

          <div className="flex justify-end pt-4 w-full">
            <button type="submit" disabled={isUploading || isCreating || !isConnected} className="h-10 px-6 bg-[#FF8400] rounded-full text-[#111111] font-jetbrains text-base font-medium hover:opacity-90 disabled:opacity-50">
              {isUploading ? 'Uploading...' : isCreating ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
