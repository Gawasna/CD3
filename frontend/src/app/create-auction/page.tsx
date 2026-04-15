import { Upload } from 'lucide-react';

export default function CreateAuction() {
  return (
    <div className="flex flex-col items-center p-16 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <div className="flex flex-col gap-12 w-full max-w-[800px]">
        <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">Create New Auction</h1>
        
        <form className="flex flex-col gap-8 bg-white border border-[#CBCCC9] rounded-2xl p-12 shadow-sm w-full">
          {/* Upload Area */}
          <div className="flex flex-col items-center justify-center gap-4 h-[200px] w-full bg-[#E7E8E5] border border-[#CBCCC9] border-dashed rounded-2xl cursor-pointer hover:bg-[#DFE0DD] transition-colors">
            <Upload className="w-8 h-8 text-[#666666]" />
            <span className="font-jetbrains text-sm font-medium text-[#666666]">Click to upload item images</span>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains font-semibold text-[#111111]">Item Title</label>
            <input 
              type="text" 
              className="h-12 px-4 rounded-lg border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]" 
              placeholder="e.g. Vintage Camera" 
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="font-jetbrains font-semibold text-[#111111]">Description</label>
            <textarea 
              rows={4}
              className="p-4 rounded-lg border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist resize-none w-full shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]" 
              placeholder="Describe your item in detail..." 
            />
          </div>

          <div className="flex gap-6 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-jetbrains font-semibold text-[#111111]">Starting Price (ETH)</label>
              <input 
                type="number" 
                step="0.01"
                className="h-12 px-4 rounded-lg border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist w-full shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]" 
                placeholder="0.00" 
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-jetbrains font-semibold text-[#111111]">Duration (Days)</label>
              <select className="h-12 px-4 rounded-lg border border-[#CBCCC9] focus:outline-none focus:border-[#FF8400] font-geist bg-white w-full shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                <option>1 Day</option>
                <option>3 Days</option>
                <option>7 Days</option>
                <option>14 Days</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 w-full">
            <button type="button" className="h-12 px-8 bg-[#FF8400] rounded-full text-[#111111] font-jetbrains font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
              Create Auction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
