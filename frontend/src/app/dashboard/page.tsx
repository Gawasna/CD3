export default function UserDashboard() {
  return (
    <div className="flex h-[max(900px,calc(100vh-72px))] bg-[#F2F3F0]">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-[#CBCCC9] p-8 flex flex-col gap-2 h-full shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#E7E8E5] cursor-pointer">
          <span className="font-jetbrains font-medium text-[#111111]">My Bids</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#E7E8E5] transition-colors cursor-pointer">
          <span className="font-jetbrains font-medium text-[#666666]">Active Auctions</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#E7E8E5] transition-colors cursor-pointer">
          <span className="font-jetbrains font-medium text-[#666666]">History</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col gap-8 p-12 flex-1 overflow-y-auto">
        <h1 className="font-jetbrains text-[32px] font-extrabold text-[#111111]">My Bids</h1>
        
        <div className="flex flex-col gap-6 w-full max-w-4xl">
          {/* Bid Item 1 */}
          <div className="flex items-center justify-between p-6 bg-white border border-[#CBCCC9] rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#E7E8E5] rounded-xl shrink-0" />
              <div className="flex flex-col">
                <span className="font-jetbrains font-bold text-lg text-[#111111]">Vintage Leica Camera</span>
                <span className="font-geist text-sm text-[#666666]">Ending in 4 hours</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-jetbrains font-bold text-xl text-[#111111]">0.85 ETH</span>
              <span className="font-geist text-sm font-medium text-[#FF8400]">Highest Bidder</span>
            </div>
          </div>
          
          {/* Bid Item 2 */}
          <div className="flex items-center justify-between p-6 bg-white border border-[#CBCCC9] rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#E7E8E5] rounded-xl shrink-0" />
              <div className="flex flex-col">
                <span className="font-jetbrains font-bold text-lg text-[#111111]">Rolex Submariner</span>
                <span className="font-geist text-sm text-[#666666]">Ending in 1 day</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-jetbrains font-bold text-xl text-[#111111]">2.4 ETH</span>
              <span className="font-geist text-sm font-medium text-[#FF5C33]">Outbid</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
