'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Image as ImageIcon, User, Star, Heart, Clock, Loader2, AlertCircle } from 'lucide-react';
import { getAuction, type Auction } from '@/services/api/auction';
import { formatEther } from 'viem';
import { isVideo, getMediaUrl, getReorderedMedia } from '@/features/auction/utils/media';

export default function AuctionDetail() {
  const { id } = useParams();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchAuction = async () => {
      try {
        setLoading(true);
        const { auction: data } = await getAuction(id as string);
        setAuction(data);
      } catch (err: any) {
        console.error('Error fetching auction:', err);
        setError(err.message || 'Failed to load auction details');
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
        <Loader2 className="w-12 h-12 text-[#FF8400] animate-spin" />
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[calc(100vh-72px)] bg-[#F2F3F0] p-8">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">Error Loading Auction</h2>
        <p className="font-geist text-base text-[#666666] text-center max-w-md">
          {error || "We couldn't find the auction you're looking for."}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#FF8400] rounded-full font-jetbrains font-medium text-[#111111]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const reorderedMedia = getReorderedMedia(auction.ipfsCid);

  const timeRemaining = () => {
    const end = new Date(auction.endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h : ${mins}m : ${secs}s`;
  };

  return (
    <div className="flex gap-8 p-12 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Left Column */}
      <div className="flex flex-col gap-6 flex-1">
        {/* Image Gallery */}
        <div className="w-full">
          {/* Main Media Display */}
          <div className="w-full h-[500px] bg-[#E7E8E5] border border-[#CBCCC9] flex items-center justify-center rounded-2xl mb-3 overflow-hidden">
            {reorderedMedia.length > 0 ? (
              isVideo(reorderedMedia[selectedImage]) ? (
                <video 
                  src={getMediaUrl(reorderedMedia[selectedImage])} 
                  controls
                  autoPlay
                  muted
                  className="w-full h-full object-contain"
                />
              ) : (
                <img 
                  src={getMediaUrl(reorderedMedia[selectedImage])} 
                  alt={auction.title}
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <ImageIcon className="w-16 h-16 text-[#666666]" />
            )}
          </div>

          {/* Thumbnails */}
          {reorderedMedia.length > 1 && (
            <div className="flex gap-3">
              {reorderedMedia.map((key, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-[100px] h-[100px] bg-[#E7E8E5] rounded-2xl flex items-center justify-center transition-all overflow-hidden ${
                    selectedImage === index
                      ? 'border-2 border-[#FF8400]'
                      : 'border border-[#CBCCC9] hover:border-[#FF8400]'
                  }`}
                >
                  {isVideo(key) ? (
                    <div className="relative w-full h-full">
                      <video src={getMediaUrl(key)} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img src={getMediaUrl(key)} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* About Section */}
        <div className="flex flex-col gap-4">
          <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">About this Item</h2>
          <p className="font-geist text-base text-[#666666] leading-relaxed whitespace-pre-wrap">
            {auction.description}
          </p>
        </div>

        {/* Item Details */}
        <div className="flex flex-col gap-4">
          <h3 className="font-jetbrains text-xl font-bold text-[#111111]">Item Details</h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-geist text-sm text-[#666666]">Category</span>
              <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                {auction.category}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-geist text-sm text-[#666666]">Shipping</span>
              <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                {formatEther(BigInt(auction.shippingCostWei))} ETH (Paid by {auction.shippingPayer})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-geist text-sm text-[#666666]">Status</span>
              <span className={`font-jetbrains text-sm font-semibold px-2 py-0.5 rounded ${
                auction.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {auction.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-8 w-[480px] shrink-0">
        {/* Main Card */}
        <div className="bg-white rounded-2xl p-8 border border-[#CBCCC9] shadow-sm flex flex-col gap-8">
          <h1 className="font-jetbrains text-[28px] font-extrabold text-[#111111] leading-tight">
            {auction.title}
          </h1>

          {/* Seller Info Compact */}
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#666666]" />
            <span className="font-geist text-sm text-[#666666]">
              Seller: {auction.seller.displayName || auction.seller.walletAddress.slice(0, 6) + '...' + auction.seller.walletAddress.slice(-4)}
            </span>
          </div>

          {/* Stats Card */}
          <div className="bg-[#E7E8E5] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-geist text-xs text-[#666666]">Total Bids</span>
              <span className="font-jetbrains text-base font-bold text-[#111111]">
                {auction._count.bids}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-geist text-xs text-[#666666]">Starting Price</span>
              <span className="font-jetbrains text-base font-bold text-[#111111]">
                {formatEther(BigInt(auction.startingPriceWei))} ETH
              </span>
            </div>
            {auction.buyNowPriceWei && auction.buyNowPriceWei !== '0' && (
              <div className="flex justify-between items-center">
                <span className="font-geist text-xs text-[#666666]">Buy Now Price</span>
                <span className="font-jetbrains text-base font-bold text-[#FF8400]">
                  {formatEther(BigInt(auction.buyNowPriceWei))} ETH
                </span>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-3 p-4 bg-[#FF5C3315] border border-[#FF5C3340] rounded-2xl">
            <Clock className="w-6 h-6 text-[#FF5C33]" />
            <span className="font-jetbrains text-xl font-bold text-[#FF5C33]">
              {timeRemaining()}
            </span>
          </div>

          {/* Current Highest Bid */}
          <div className="flex flex-col gap-2">
            <span className="font-jetbrains text-xl font-bold text-[#111111]">
              Current Bid: {auction.startingPriceWei ? formatEther(BigInt(auction.startingPriceWei)) : '0'} ETH
            </span>
            <span className="font-geist text-sm text-[#666666]">Bid Amount (ETH)</span>
          </div>

          {/* Bid Input */}
          <div className="flex flex-col gap-4">
            <input
              type="number"
              step="0.01"
              disabled={auction.status !== 'ACTIVE'}
              placeholder="Enter bid amount"
              className="w-full h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist disabled:opacity-50"
            />
            <button 
              disabled={auction.status !== 'ACTIVE'}
              className="w-full h-10 bg-[#FF8400] rounded-full font-jetbrains text-base font-medium text-[#111111] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {auction.status === 'ACTIVE' ? 'Place Bid' : 'Auction Not Active'}
            </button>
          </div>

          {/* Watch Button */}
          <button
            onClick={() => setIsWatching(!isWatching)}
            className={`w-full h-11 rounded-full font-jetbrains text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              isWatching
                ? 'bg-[#FF8400] text-[#111111]'
                : 'bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] hover:bg-[#CBCCC9]'
            }`}
          >
            <Heart
              className={`w-5 h-5 ${isWatching ? 'fill-[#111111]' : ''}`}
            />
            {isWatching ? 'Watching' : 'Add to Watchlist'}
          </button>
        </div>

        {/* Seller Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#CBCCC9] flex flex-col gap-4">
          <h3 className="font-jetbrains text-base font-bold text-[#111111]">
            Seller Information
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#E7E8E5] flex items-center justify-center overflow-hidden">
              {auction.seller.avatarUrl ? (
                <img src={auction.seller.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-[#666666]" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                {auction.seller.displayName || auction.seller.walletAddress}
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#FF8400] text-[#FF8400]" />
                <span className="font-geist text-xs text-[#666666]">
                  Seller Verified
                </span>
              </div>
            </div>
          </div>
          <button className="w-full h-10 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] font-jetbrains text-sm font-semibold text-[#111111] hover:bg-[#CBCCC9] transition-colors">
            Contact Seller
          </button>
        </div>
      </div>
    </div>
  );
}
