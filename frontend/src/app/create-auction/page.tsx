'use client';

import { useState, useRef, DragEvent } from 'react';
import { Upload, Check, X, Image as ImageIcon, Video } from 'lucide-react';

type Condition = 'new' | 'like-new' | 'used' | 'for-parts';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function CreateAuction() {
  const [selectedCondition, setSelectedCondition] = useState<Condition>('new');
  const [shippingEnabled, setShippingEnabled] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conditions: { value: Condition; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'used', label: 'Used' },
    { value: 'for-parts', label: 'For Parts' },
  ];

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const videoTypes = ['video/mp4', 'video/quicktime']; // quicktime is .mov
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
        alert(validation.error);
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

  return (
    <div className="flex flex-col items-center p-16 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <div className="flex flex-col gap-12 w-full max-w-[800px]">
        <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">Create New Auction</h1>
        
        <form className="flex flex-col gap-8 bg-white border border-[#CBCCC9] rounded-2xl p-12 shadow-sm w-full">
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
                  JPG, PNG (&lt; 5MB) • MP4, MOV (&lt; 50MB)
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
                    
                    {/* Remove Button */}
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

                    {/* File Type Badge */}
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
