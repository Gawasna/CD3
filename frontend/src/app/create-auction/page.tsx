'use client';

import { useState } from 'react';
import { Upload, Check } from 'lucide-react';

type Condition = 'new' | 'like-new' | 'used' | 'for-parts';

export default function CreateAuction() {
  const [selectedCondition, setSelectedCondition] = useState<Condition>('new');
  const [shippingEnabled, setShippingEnabled] = useState(true);

  const conditions: { value: Condition; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'used', label: 'Used' },
    { value: 'for-parts', label: 'For Parts' },
  ];

  return (
    <div className="flex flex-col items-center p-16 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <div className="flex flex-col gap-12 w-full max-w-[800px]">
        <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">Create New Auction</h1>
        
        <form className="flex flex-col gap-8 bg-white border border-[#CBCCC9] rounded-2xl p-12 shadow-sm w-full">
          {/* Upload Area */}
          <div className="flex flex-col items-center justify-center gap-4 h-[200px] w-full bg-[#E7E8E5] border border-[#CBCCC9] border-dashed rounded-2xl cursor-pointer hover:bg-[#DFE0DD] transition-colors">
            <Upload className="w-8 h-8 text-[#666666]" />
            <span className="font-geist text-sm text-[#666666]">
              Click or Drag & Drop to Upload Media (JPG/PNG &lt; 5MB)
            </span>
          </div>

          {/* Item Name */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Item Name</label>
            <input 
              type="text" 
              className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" 
              placeholder="e.g. Vintage Camera" 
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Category</label>
            <select className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist bg-white w-full appearance-none">
              <option value="">Select category</option>
              <option value="electronics">Electronics</option>
              <option value="watches">Watches & Jewelry</option>
              <option value="fashion">Fashion & Accessories</option>
              <option value="collectibles">Collectibles</option>
              <option value="art">Art</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Description & Details</label>
            <textarea 
              rows={5}
              className="p-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist resize-none w-full" 
              placeholder="Describe your item in detail..." 
            />
          </div>

          {/* Condition */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Condition</label>
            <div className="flex gap-3">
              {conditions.map((condition) => (
                <button
                  key={condition.value}
                  type="button"
                  onClick={() => setSelectedCondition(condition.value)}
                  className={`px-5 py-2.5 rounded-full font-jetbrains text-sm font-semibold transition-colors ${
                    selectedCondition === condition.value
                      ? 'bg-[#FF8400] text-[#111111]'
                      : 'bg-[#E7E8E5] text-[#111111] border border-[#CBCCC9] hover:bg-[#CBCCC9]'
                  }`}
                >
                  {condition.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price and Duration */}
          <div className="flex gap-6 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-jetbrains text-sm font-semibold text-[#111111]">Starting Price (ETH)</label>
              <input 
                type="number" 
                step="0.01"
                className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full" 
                placeholder="0.00" 
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-jetbrains text-sm font-semibold text-[#111111]">Duration (1 hr - 30 days)</label>
              <select className="h-10 px-4 rounded-2xl border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist bg-white w-full">
                <option>1 Day</option>
                <option>3 Days</option>
                <option>7 Days</option>
                <option>14 Days</option>
                <option>30 Days</option>
              </select>
            </div>
          </div>

          {/* Shipping Options */}
          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains text-sm font-semibold text-[#111111]">Shipping Options</label>
            <button
              type="button"
              onClick={() => setShippingEnabled(!shippingEnabled)}
              className="flex items-center gap-3"
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  shippingEnabled
                    ? 'bg-[#FF8400]'
                    : 'bg-white border border-[#CBCCC9]'
                }`}
              >
                {shippingEnabled && <Check className="w-3.5 h-3.5 text-[#111111]" />}
              </div>
              <span className="font-geist text-sm text-[#111111]">
                I will handle shipping
              </span>
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 w-full">
            <button 
              type="submit" 
              className="h-10 px-6 bg-[#FF8400] rounded-full text-[#111111] font-jetbrains text-base font-medium hover:opacity-90 transition-opacity"
            >
              Mint & Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
