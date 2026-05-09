'use client';

import { useState } from 'react';
import { Image, User, Star, Heart, Clock } from 'lucide-react';

interface BidHistoryItem {
  address: string;
  amount: string;
  time: string;
}

export default function AuctionDetail() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  // Mock data
  const images = [
    '/placeholder1.jpg',
    '/placeholder2.jpg',
    '/placeholder3.jpg',
    '/placeholder4.jpg',
  ];

  const bidHistory: BidHistoryItem[] = [
    { address: '0x34..EF56', amount: '1.25 ETH', time: '2 minutes ago' },
    { address: '0x78..GH90', amount: '1.20 ETH', time: '15 minutes ago' },
    { address: '0xAB..CD12', amount: '1.15 ETH', time: '1 hour ago' },
    { address: '0xCD..EF34', amount: '1.10 ETH', time: '2 hours ago' },
  ];

  const itemDetails = [
    { label: 'Condition', value: 'Like New' },
    { label: 'Category', value: 'Electronics' },
    { label: 'Shipping', value: 'Worldwide' },
    { label: 'Location', value: 'New York, USA' },
  ];

  return (
    <div className="flex gap-8 p-12 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Left Column */}
      <div className="flex flex-col gap-6 flex-1">
        {/* Image Gallery */}
        <div className="w-full">
          {/* Main Image */}
          <div className="w-full h-[400px] bg-[#E7E8E5] border border-[#CBCCC9] flex items-center justify-center rounded-2xl mb-3">
            <Image className="w-16 h-16 text-[#666666]" />
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-[100px] h-[100px] bg-[#E7E8E5] rounded-2xl flex items-center justify-center transition-all ${
                  selectedImage === index
                    ? 'border-2 border-[#FF8400]'
                    : 'border border-[#CBCCC9] hover:border-[#FF8400]'
                }`}
              >
                <Image className="w-8 h-8 text-[#666666]" />
              </button>
            ))}
          </div>
        </div>

        {/* About Section */}
        <div className="flex flex-col gap-4">
          <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">About this Item</h2>
          <p className="font-geist text-base text-[#666666] leading-relaxed">
            Nikon F3 in pristine condition. Used only in studio. Box and papers included. Smart Contract verifies ownership history on Ethereum block explorer.
          </p>
        </div>

        {/* Item Details */}
        <div className="flex flex-col gap-4">
          <h3 className="font-jetbrains text-xl font-bold text-[#111111]">Item Details</h3>
          <div className="flex flex-col gap-4">
            {itemDetails.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-geist text-sm text-[#666666]">{detail.label}</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bid History */}
        <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-4">
          <h3 className="font-jetbrains text-xl font-bold text-[#111111]">Bid History</h3>
          <div className="flex flex-col">
            {bidHistory.map((bid, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-3 border-b border-[#CBCCC9] last:border-b-0"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                    {bid.address}
                  </span>
                  <span className="font-geist text-xs text-[#666666]">{bid.time}</span>
                </div>
                <span className="font-jetbrains text-base font-bold text-[#111111]">
                  {bid.amount}
                </span>
              </div>
            ))}
          </div>
          <button className="text-center font-jetbrains text-sm font-semibold text-[#FF8400] hover:underline">
            View All Bids →
          </button>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-8 w-[480px] shrink-0">
        {/* Main Card */}
        <div className="bg-white rounded-2xl p-8 border border-[#CBCCC9] shadow-sm flex flex-col gap-8">
          <h1 className="font-jetbrains text-[28px] font-extrabold text-[#111111] leading-tight">
            Vintage Nikon F3 Camera
          </h1>

          {/* Seller Info Compact */}
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#666666]" />
            <span className="font-geist text-sm text-[#666666]">Seller: 0x89...FE42</span>
          </div>

          {/* Stats Card */}
          <div className="bg-[#E7E8E5] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-geist text-xs text-[#666666]">Total Bids</span>
              <span className="font-jetbrains text-base font-bold text-[#111111]">24</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-geist text-xs text-[#666666]">Views</span>
              <span className="font-jetbrains text-base font-bold text-[#111111]">342</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-geist text-xs text-[#666666]">Watchers</span>
              <span className="font-jetbrains text-base font-bold text-[#111111]">18</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-3 p-4 bg-[#FF5C3315] border border-[#FF5C3340] rounded-2xl">
            <Clock className="w-6 h-6 text-[#FF5C33]" />
            <span className="font-jetbrains text-xl font-bold text-[#FF5C33]">
              01h : 45m : 12s
            </span>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-2">
            <span className="font-jetbrains text-xl font-bold text-[#111111]">
              Highest Bid: 1.25 ETH
            </span>
            <span className="font-geist text-sm text-[#666666]">Bid Amount (ETH)</span>
          </div>

          {/* Bid Input */}
          <div className="flex flex-col gap-4">
            <input
              type="number"
              step="0.01"
              placeholder="Enter bid amount"
              className="w-full h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist"
            />
            <button className="w-full h-10 bg-[#FF8400] rounded-full font-jetbrains text-base font-medium text-[#111111] hover:opacity-90 transition-opacity">
              Place Bid
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
            <div className="w-12 h-12 rounded-full bg-[#E7E8E5] flex items-center justify-center">
              <User className="w-6 h-6 text-[#666666]" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                0x89...FE42
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#FF8400] text-[#FF8400]" />
                <span className="font-geist text-xs text-[#666666]">
                  4.8 (127 sales)
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
