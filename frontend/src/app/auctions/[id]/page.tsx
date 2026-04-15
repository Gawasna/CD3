export default function AuctionDetail() {
  return (
    <div className="flex gap-8 p-8 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Left Column */}
      <div className="flex flex-col gap-6 flex-1">
        <div className="w-full h-[480px] bg-[#E7E8E5] border border-[#CBCCC9] flex items-center justify-center rounded-2xl">
          <span className="font-geist text-[#666666]">Image Gallery</span>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">About this Item</h2>
          <p className="font-geist text-base text-[#666666] leading-relaxed">
            Nikon F3 in pristine condition. Used only in studio. Box and papers included. Smart Contract verifies ownership history on Ethereum block explorer.
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-8 w-[480px] bg-white rounded-2xl p-8 border border-[#CBCCC9] shadow-sm shrink-0 h-fit">
        <h1 className="font-jetbrains text-[28px] font-extrabold text-[#111111] leading-tight">
          Vintage Nikon F3 Camera
        </h1>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E7E8E5]" />
          <span className="font-geist text-sm text-[#666666]">Listed by 0x1234...abcd</span>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-[#FF5C3315] border border-[#FF5C3340] rounded-2xl">
          <span className="font-jetbrains text-sm font-medium text-[#FF5C33]">Ends in</span>
          <span className="font-jetbrains text-2xl font-bold text-[#FF5C33]">02:15:45</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-geist text-sm text-[#666666]">Highest Bid</span>
          <span className="font-jetbrains text-3xl font-bold text-[#111111]">1.25 ETH</span>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button className="w-full h-12 bg-[#FF8400] rounded-full font-jetbrains font-semibold text-[#111111] hover:opacity-90 transition-opacity">
            Place Bid
          </button>
          <button className="w-full h-12 bg-transparent border border-[#CBCCC9] rounded-full font-jetbrains font-semibold text-[#111111] hover:bg-[#F2F3F0] transition-colors">
            Make Offer
          </button>
        </div>
      </div>
    </div>
  );
}
