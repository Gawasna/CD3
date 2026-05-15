'use client';

import { useState, useEffect, useRef, memo, MouseEvent as ReactMouseEvent } from 'react';
import { useParams } from 'next/navigation';
import { Image as ImageIcon, User, Star, Clock, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAuction, type Auction } from '@/services/api/auction';
import { formatEther } from 'viem';
import { isVideo, getMediaUrl, getReorderedMedia } from '@/features/auction/utils/media';
import WatchlistButton from '@/components/shared/WatchlistButton';

// --- Sub-components ---
const AuctionTimer = memo(function AuctionTimer({ 
  status, 
  startTime, 
  endTime 
}: { 
  status: string; 
  startTime: string; 
  endTime: string; 
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status === 'ENDED' || status === 'CANCELED') return;
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [status, startTime, endTime]);

  const timeRemaining = () => {
    const target = status === 'UPCOMING' 
      ? new Date(startTime).getTime() 
      : new Date(endTime).getTime();
    
    const now = new Date().getTime();
    const diff = target - now;
    
    if (diff <= 0) {
      return status === 'UPCOMING' ? 'Starting soon...' : 'Ended';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    parts.push(`${hours.toString().padStart(2, '0')}h`);
    parts.push(`${mins.toString().padStart(2, '0')}m`);
    parts.push(`${secs.toString().padStart(2, '0')}s`);

    return parts.join(' : ');
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-[#FF5C3315] border border-[#FF5C3340] rounded-2xl">
      <Clock className="w-6 h-6 text-[#FF5C33]" />
      <span className="font-jetbrains text-xl font-bold text-[#FF5C33]">
        {timeRemaining()}
      </span>
    </div>
  );
});

export default function AuctionDetail() {
  const { id } = useParams();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Magnifier state
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [[x, y], setXY] = useState([0, 0]);
  // Use a more robust state for image dimensions
  const [imgLayout, setImgLayout] = useState({ 
    width: 0, 
    height: 0, 
    left: 0, 
    top: 0,
    containerWidth: 0,
    containerHeight: 0
  });
  
  const magnifierHeight = 250;
  const magnifierWidth = 250;
  const zoomLevel = 2.5;

  const autoSlideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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

  const reorderedMedia = getReorderedMedia(auction?.ipfsCid || '[]');

  // Auto-slide logic
  useEffect(() => {
    if (reorderedMedia.length <= 1 || isPaused || loading || showMagnifier) return;

    const interval = setInterval(() => {
      setSelectedImage((prev) => {
        const nextIndex = (prev + 1) % reorderedMedia.length;
        // If next item is a video, we might want to let the video logic handle it, 
        // but for now, we just skip auto-slide if it lands on a video or let it play.
        // A better approach is to check if CURRENT image is video
        if (isVideo(reorderedMedia[prev])) return prev; 
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [reorderedMedia.length, isPaused, loading, showMagnifier, reorderedMedia]);

  // Function to calculate the actual pixel-dimensions of an object-contain image
  const calculateImageLayout = () => {
    if (!imageRef.current || !containerRef.current) return null;

    const container = containerRef.current.getBoundingClientRect();
    const cw = container.width;
    const ch = container.height;
    
    const nw = imageRef.current.naturalWidth;
    const nh = imageRef.current.naturalHeight;
    const ar = nw / nh;
    const cr = cw / ch;

    let dw, dh, ol, ot;

    if (ar > cr) {
      // Image is wider than container relative to height
      dw = cw;
      dh = cw / ar;
      ol = 0;
      ot = (ch - dh) / 2;
    } else {
      // Image is taller than container relative to width
      dh = ch;
      dw = ch * ar;
      ot = 0;
      ol = (cw - dw) / 2;
    }

    return { width: dw, height: dh, left: ol, top: ot, containerWidth: cw, containerHeight: ch };
  };

  const handleManualSelect = (index: number) => {
    setSelectedImage(index);
    setShowMagnifier(false);
  };

  const handlePrevSlide = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setSelectedImage((prev) => (prev - 1 + reorderedMedia.length) % reorderedMedia.length);
    setShowMagnifier(false);
  };

  const handleNextSlide = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setSelectedImage((prev) => (prev + 1) % reorderedMedia.length);
    setShowMagnifier(false);
  };

  const handleImageClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isVideo(reorderedMedia[selectedImage]) || !imageRef.current) return;
    
    const layout = calculateImageLayout();
    if (!layout) return;

    const containerRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.pageX - containerRect.left - window.scrollX;
    const mouseY = e.pageY - containerRect.top - window.scrollY;

    // Check if click is within the actual image pixels
    const isInside = 
      mouseX >= layout.left && 
      mouseX <= layout.left + layout.width && 
      mouseY >= layout.top && 
      mouseY <= layout.top + layout.height;

    if (!showMagnifier) {
      if (!isInside) return; // Don't activate if clicking on empty space

      setImgLayout(layout);
      setShowMagnifier(true);
      setIsPaused(true);
      setXY([mouseX, mouseY]);
    } else {
      setShowMagnifier(false);
      setIsPaused(false);
    }
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!showMagnifier) return;
    const containerRect = e.currentTarget.getBoundingClientRect();
    
    const mouseX = e.pageX - containerRect.left - window.scrollX;
    const mouseY = e.pageY - containerRect.top - window.scrollY;

    // Only update and show if mouse is within image bounds
    const isInside = 
      mouseX >= imgLayout.left && 
      mouseX <= imgLayout.left + imgLayout.width && 
      mouseY >= imgLayout.top && 
      mouseY <= imgLayout.top + imgLayout.height;

    if (isInside) {
      setXY([mouseX, mouseY]);
    } else {
      // Deactivate if mouse leaves the actual image pixels
      setShowMagnifier(false);
      setIsPaused(false);
    }
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
    setIsPaused(false);
  };

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

  // Calculate style with precision
  const getMagnifierStyle = () => {
    if (!showMagnifier) return {};

    // Relative position within the actual image pixels (0 to 1)
    const relX = (x - imgLayout.left) / imgLayout.width;
    const relY = (y - imgLayout.top) / imgLayout.height;

    return {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      height: `${magnifierHeight}px`,
      width: `${magnifierWidth}px`,
      top: `${y - magnifierHeight / 2}px`,
      left: `${x - magnifierWidth / 2}px`,
      border: "2px solid #FF8400",
      backgroundColor: "#E7E8E5",
      backgroundImage: `url('${getMediaUrl(reorderedMedia[selectedImage])}')`,
      backgroundRepeat: "no-repeat",
      // Accuracy: The background image should be the size of the ACTUAL image pixels * zoomLevel
      backgroundSize: `${imgLayout.width * zoomLevel}px ${imgLayout.height * zoomLevel}px`,
      // Accuracy: Map the relative point (0-1) on displayed pixels to the zoomed background
      backgroundPosition: `${-relX * imgLayout.width * zoomLevel + magnifierWidth / 2}px ${-relY * imgLayout.height * zoomLevel + magnifierHeight / 2}px`,
      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)",
      zIndex: 50,
      borderRadius: "4px",
    };
  };

  return (
    <div className="flex gap-8 p-12 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Left Column */}
      <div className="flex flex-col gap-6 flex-1 select-none">
        {/* Image Gallery */}
        <div className="w-full">
          {/* Main Media Display */}
          <div 
            ref={containerRef}
            className={`w-full h-[500px] bg-[#E7E8E5] border border-[#CBCCC9] flex items-center justify-center rounded-2xl mb-3 overflow-hidden relative group ${
              showMagnifier ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
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
                  ref={imageRef}
                  src={getMediaUrl(reorderedMedia[selectedImage])} 
                  alt={auction.title}
                  className="w-full h-full object-contain pointer-events-none"
                />
              )
            ) : (
              <ImageIcon className="w-16 h-16 text-[#666666]" />
            )}
            
            {/* Magnifier Lens - Precision Square Style */}
            {showMagnifier && !isVideo(reorderedMedia[selectedImage]) && (
              <div style={getMagnifierStyle()} />
            )}

            {/* Navigation Buttons */}
            {reorderedMedia.length > 1 && !showMagnifier && (
              <>
                <button 
                  onClick={handlePrevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-[#FF8400] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm z-20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleNextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-[#FF8400] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm z-20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            {/* Slide Indicators */}
            {reorderedMedia.length > 1 && !showMagnifier && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full z-20">
                {reorderedMedia.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualSelect(i);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      selectedImage === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {reorderedMedia.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {reorderedMedia.map((key, index) => (
                <button
                  key={index}
                  onClick={() => handleManualSelect(index)}
                  className={`relative min-w-[100px] h-[100px] bg-[#E7E8E5] rounded-2xl flex items-center justify-center transition-all overflow-hidden flex-shrink-0 ${
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
                auction.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                auction.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
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
          <div className="flex flex-col gap-2">
            <span className="font-geist text-xs text-[#666666]">
              {auction.status === 'UPCOMING' ? 'Auction Starts In' : 'Auction Ends In'}
            </span>
            <AuctionTimer 
              status={auction.status} 
              startTime={auction.startTime} 
              endTime={auction.endTime} 
            />
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
              {auction.status === 'ACTIVE' ? 'Place Bid' : 
               auction.status === 'UPCOMING' ? 'Auction Starts Soon' : 
               'Auction Not Active'}
            </button>
          </div>

          {/* Watch Button */}
          <WatchlistButton 
            auctionId={auction.id} 
            className="!w-full !h-11 !rounded-full !font-jetbrains !text-sm !font-semibold !flex !items-center !justify-center !gap-2"
          />
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
