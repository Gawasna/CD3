'use client';

import { useState, useRef, DragEvent, FormEvent, useEffect } from 'react';
import { Upload, Check, X, Video, AlertCircle, Info } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useRouter } from 'next/navigation';
import { uploadAuctionMedia, createAuction, type AuctionCategory, type ShippingPayer } from '@/services/api/auction';
import { fetchMe } from '@/services/api/auth';
import { useQuery } from '@tanstack/react-query';
import AuctionPlatformABI from '@/services/blockchain/abi/AuctionPlatform.json';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/auth/ToastContainer';

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

  // Update store when fresh data arrives
  useEffect(() => {
    if (latestUser) {
      updateUser(latestUser);
    }
  }, [latestUser, updateUser]);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check KYC status - use latest if available, fallback to store
  const isKycApproved = (latestUser?.kycStatus || user?.kycStatus) === 'APPROVED';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not connected
  useEffect(() => {
    if (mounted && _hasHydrated && !isConnecting && !isReconnecting && !isConnected) {
      router.push('/auth-demo');
    }
  }, [isConnected, isConnecting, isReconnecting, mounted, _hasHydrated, router]);

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

  // Handle transaction confirmation
  useEffect(() => {
    if (isTxConfirmed && txHash && uploadedFilenames.length > 0 && isCreating) {
      const registerAuction = async () => {
        try {
          console.log('Transaction confirmed, registering auction in backend...', {
            txHash,
            uploadedFilenames
          });
          setError(null);
          // 3. Register auction in backend
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

          console.log('Auction registered successfully:', auctionId);
          showToast('success', 'Auction created successfully!');
          // Success - redirect to auction page
          router.push(`/auctions/${auctionId}`);
        } catch (error: any) {
          console.error('Error registering auction:', error);
          const msg = `Transaction confirmed on blockchain, but failed to register in backend: ${error.message}. Please contact support with TX hash: ${txHash}`;
          setError(msg);
          showToast('error', 'Backend registration failed. Please contact support.');
          setIsCreating(false);
        }
      };
      
      registerAuction();
    }
  }, [isTxConfirmed, txHash, uploadedFilenames, isCreating, title, description, category, startingPrice, buyNowPrice, hasBuyNow, duration, shippingCost, shippingPayer, router, showToast]);

  // If not ready, show loading to prevent flicker and incorrect KYC warnings
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
      if (file.size > maxImageSize) {
        return { valid: false, error: 'Image must be less than 5MB' };
      }
      return { valid: true };
    } else if (videoTypes.includes(file.type)) {
      if (file.size > maxVideoSize) {
        return { valid: false, error: 'Video must be less than 50MB' };
      }
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

      const isImage = file.type.startsWith('image/');
      const preview = URL.createObjectURL(file);
      
      newMediaFiles.push({
        file,
        preview,
        type: isImage ? 'image' : 'video',
      });
    });

    setMediaFiles((prev) => [...prev, ...newMediaFiles]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConnected || !address) {
      const msg = 'Please connect your wallet first';
      setError(msg);
      showToast('error', msg);
      return;
    }

    if (!isKycApproved) {
      const msg = 'You must complete KYC verification to create auctions.';
      setError(msg);
      showToast('error', msg);
      return;
    }

    if (mediaFiles.length === 0) {
      const msg = 'Please upload at least one media file';
      setError(msg);
      showToast('error', msg);
      return;
    }

    if (title.length < 10) {
      const msg = 'Title must be at least 10 characters';
      setError(msg);
      showToast('error', msg);
      return;
    }

    if (description.length < 20) {
      const msg = 'Description must be at least 20 characters';
      setError(msg);
      showToast('error', msg);
      return;
    }

    if (hasBuyNow && (!buyNowPrice || parseFloat(buyNowPrice) <= parseFloat(startingPrice))) {
      const msg = 'Buy Now price must be greater than starting price';
      setError(msg);
      showToast('error', msg);
      return;
    }

    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      
      if (!contractAddress || contractAddress === '0x') {
        throw new Error('Contract address is not configured. Please check NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local');
      }

      setIsUploading(true);

      // Reorder mediaFiles: Ensure first element is an image for thumbnail if any images exist
      const firstImageIndex = mediaFiles.findIndex(m => m.type === 'image');
      let currentMediaFiles = [...mediaFiles];
      if (firstImageIndex > 0) {
        // Move first image to index 0
        const firstImage = currentMediaFiles.splice(firstImageIndex, 1)[0];
        currentMediaFiles.unshift(firstImage);
        setMediaFiles(currentMediaFiles);
      }

      // 1. Upload media files
      const { filenames } = await uploadAuctionMedia(currentMediaFiles.map((m) => m.file));
      setUploadedFilenames(filenames);
      setIsUploading(false);

      // 2. Prepare transaction
      setIsCreating(true);
      const startingPriceWei = parseEther(startingPrice);
      const buyNowPriceWei = (hasBuyNow && buyNowPrice) ? parseEther(buyNowPrice) : BigInt(0);
      const durationSeconds = parseInt(duration);

      // ── Timestamp Buffer ────────────────────────────────────────────────
      // Để tránh lỗi "startTime must be >= now" do lệch múi giờ giữa Browser và Ganache,
      // chúng ta sẽ trừ đi 60 giây nếu startTime được chọn là 'bây giờ'.
      const now = Math.floor(Date.now() / 1000);
      let startTimestamp = startTime 
        ? Math.floor(new Date(startTime).getTime() / 1000) 
        : now;

      if (startTimestamp <= now) {
        // Gán bằng now - 60 để Smart Contract hiểu là phiên đã bắt đầu (Active)
        startTimestamp = now - 60; 
      }

      // Match Smart Contract logic: 10% of starting price, min 0.01 ETH
      const collateralBps = BigInt(1000); // 10%
      const calcCollateral = (startingPriceWei * collateralBps) / BigInt(10000);
      const minCollateral = parseEther('0.01');
      const requiredCollateral = calcCollateral > minCollateral ? calcCollateral : minCollateral;

      console.log('Creating auction with:', {
        startingPriceWei: startingPriceWei.toString(),
        startTimestamp,
        durationSeconds,
        productCid: JSON.stringify(filenames),
        buyNowPriceWei: buyNowPriceWei.toString(),
        value: requiredCollateral.toString()
      });

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: AuctionPlatformABI.abi,
        functionName: 'createAuction',
        args: [
          startingPriceWei,
          BigInt(startTimestamp),
          BigInt(durationSeconds),
          JSON.stringify(filenames),
          buyNowPriceWei,
          shippingPayer === 'BUYER' ? 0 : 1, // 0: Buyer, 1: Seller
        ],
        value: requiredCollateral,
      }, {

        onError: (error: any) => {
          console.error('Wallet error:', error);
          const msg = error.shortMessage || error.message || 'Transaction rejected by wallet';
          setError(msg);
          showToast('error', msg);
          setIsCreating(false);
        }
      });
    } catch (error: any) {
      console.error('Error creating auction:', error);
      const msg = error.message || 'Failed to create auction';
      setError(msg);
      showToast('error', msg);
      setIsUploading(false);
      setIsCreating(false);
    }
  };

  // Helper function to get status text
  const getStatusText = () => {
    if (isUploading) return 'Step 1/3: Uploading Media...';
    if (isCreating && !txHash) return 'Step 2/3: Waiting for Wallet Approval...';
    if (isCreating && txHash && isTxConfirming) return 'Step 3/3: Confirming Transaction on Blockchain...';
    if (isCreating && isTxConfirmed) return 'Step 4/3: Finalizing Auction Registration...';
    return 'Create Auction';
  };

  return (
    <div className="flex flex-col items-center p-16 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <div className="flex flex-col gap-12 w-full max-w-[800px]">
        <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">Create New Auction</h1>
        
        {/* KYC Warning */}
        {!isKycApproved && (
          <div className="flex items-start gap-3 p-4 bg-[#FFF3CD] border border-[#FFC107] rounded-2xl">
            <AlertCircle className="w-5 h-5 text-[#856404] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <p className="font-jetbrains text-sm font-semibold text-[#856404]">
                KYC Verification Required
              </p>
              <p className="font-geist text-sm text-[#856404]">
                You must complete KYC verification before creating auctions. 
                <a href="/kyc" className="underline ml-1 hover:text-[#FF8400]">
                  Complete KYC now
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-[#F8D7DA] border border-[#F5C2C7] rounded-2xl">
            <AlertCircle className="w-5 h-5 text-[#842029] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <p className="font-jetbrains text-sm font-semibold text-[#842029]">
                Error
              </p>
              <p className="font-geist text-sm text-[#842029]">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Success Message - Transaction Confirmed */}
        {isTxConfirmed && !error && (
          <div className="flex items-start gap-3 p-4 bg-[#D1E7DD] border border-[#BADBCC] rounded-2xl">
            <Check className="w-5 h-5 text-[#0F5132] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <p className="font-jetbrains text-sm font-semibold text-[#0F5132]">
                Transaction Confirmed
              </p>
              <p className="font-geist text-sm text-[#0F5132]">
                Your auction is being registered. Please wait...
              </p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 bg-white border border-[#CBCCC9] rounded-2xl p-12 shadow-sm w-full">
          {/* Upload Area */}
          <div className="flex flex-col gap-4 w-full">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,video/mp4,video/quicktime"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <div
              onClick={handleUploadClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-4 h-[200px] w-full border border-dashed rounded-2xl cursor-pointer transition-colors ${
                isDragging
                  ? 'bg-[#FFE5CC] border-[#FF8400]'
                  : 'bg-[#E7E8E5] border-[#CBCCC9] hover:bg-[#DFE0DD]'
              }`}
            >
              <Upload className="w-8 h-8 text-[#666666]" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-geist text-sm text-[#666666]">
                  Click or Drag & Drop to Upload Media
                </span>
                <span className="font-geist text-xs text-[#999999]">
                  JPG, PNG (&lt; 5MB) • MP4, MOV (&lt; 50MB) • Max 6 files
                </span>
              </div>
            </div>

            {/* Preview Grid */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-4 w-full">
                {mediaFiles.map((media, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-[#E7E8E5] rounded-xl overflow-hidden border border-[#CBCCC9] group"
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          src={media.preview}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-[#111111] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF8400]"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>

                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-white font-jetbrains text-[10px] font-semibold">
                      {media.type === 'image' ? 'IMG' : 'VID'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Item Name */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Item Name *</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={10}
              className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" 
              placeholder="e.g. Vintage Camera (min 10 characters)" 
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AuctionCategory)}
              required
              className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist bg-white w-full appearance-none"
            >
              <option value="ELECTRONICS">Electronics</option>
              <option value="FASHION">Fashion & Accessories</option>
              <option value="FURNITURE">Furniture</option>
              <option value="COLLECTIBLES">Collectibles</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Description & Details *</label>
            <textarea 
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={20}
              className="p-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist resize-none w-full" 
              placeholder="Describe your item in detail (min 20 characters)..." 
            />
          </div>

          {/* Start Time and Duration */}
          <div className="flex flex-col gap-6 w-full">
            <div className="flex gap-6 w-full">
              <div className="flex flex-col gap-2 flex-1">
                <label className="font-jetbrains text-sm font-semibold text-[#111111]">Start Time</label>
                <input 
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" 
                />
                <p className="font-geist text-[10px] text-[#666666]">Leave blank to start immediately after confirmation</p>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="font-jetbrains text-sm font-semibold text-[#111111]">Duration *</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist bg-white w-full"
                >
                  <option value="3600">1 Hour (Test)</option>
                  <option value="86400">1 Day</option>
                  <option value="259200">3 Days</option>
                  <option value="604800">7 Days</option>
                  <option value="1209600">14 Days</option>
                  <option value="2592000">30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-6 w-full">
            <div className="flex gap-6 w-full">
              <div className="flex flex-col gap-2 flex-1">
                <label className="font-jetbrains text-sm font-semibold text-[#111111]">Starting Price (ETH) *</label>
                <input 
                  type="number" 
                  step="0.000001"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  required
                  min="0.000001"
                  className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" 
                  placeholder="0.000000" 
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between">
                  <label className="font-jetbrains text-sm font-semibold text-[#111111]">Buy Now Price (ETH)</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={hasBuyNow}
                      onChange={(e) => setHasBuyNow(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-[#E7E8E5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF8400]"></div>
                    <span className="ml-2 font-geist text-xs text-[#666666]">Enable</span>
                  </label>
                </div>
                <input 
                  type="number" 
                  step="0.000001"
                  value={buyNowPrice}
                  onChange={(e) => setBuyNowPrice(e.target.value)}
                  disabled={!hasBuyNow}
                  min="0"
                  className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full disabled:bg-[#F2F3F0] disabled:cursor-not-allowed" 
                  placeholder={hasBuyNow ? "0.000000" : "Disabled"} 
                />
              </div>
            </div>
            
            {hasBuyNow && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="font-geist text-xs text-blue-600">
                  Buy Now Price allows users to purchase the item immediately, ending the auction early. It must be higher than the starting price.
                </p>
              </div>
            )}
          </div>
          {/* Shipping */}
          <div className="flex gap-6 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-jetbrains text-sm font-semibold text-[#111111]">Shipping Cost (ETH)</label>
              <input 
                type="number" 
                step="0.000001"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                min="0"
                className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" 
                placeholder="0.000000" 
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-jetbrains text-sm font-semibold text-[#111111]">Shipping Paid By</label>
              <select
                value={shippingPayer}
                onChange={(e) => setShippingPayer(e.target.value as ShippingPayer)}
                className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist bg-white w-full"
              >
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 w-full">
            <button 
              type="submit"
              disabled={isUploading || isCreating || !isConnected || !isKycApproved}
              className="h-10 px-6 bg-[#FF8400] rounded-full text-[#111111] font-jetbrains text-base font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getStatusText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
