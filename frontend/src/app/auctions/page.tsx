import Link from 'next/link';

export default function ExploreAuctions() {
  return (
    <div className="flex gap-12 p-12 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Filter Sidebar */}
      <aside className="flex flex-col gap-8 w-[280px] shrink-0">
        <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">Filters</h2>
        
        <div className="flex flex-col gap-4">
          <h3 className="font-jetbrains font-semibold text-lg text-[#111111]">Categories</h3>
          <div className="flex flex-col gap-2 font-geist text-[#666666]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" /> Art
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" /> Collectibles
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" /> Electronics
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-jetbrains font-semibold text-lg text-[#111111]">Status</h3>
          <div className="flex flex-col gap-2 font-geist text-[#666666]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" /> Active
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" /> Ending Soon
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" /> Completed
            </label>
          </div>
        </div>
      </aside>

      {/* Grid Content */}
      <main className="flex flex-col gap-8 flex-1">
        <div className="flex justify-between items-center w-full">
          <h2 className="font-geist text-lg text-[#666666]">Showing 124 items</h2>
          <select className="border border-[#CBCCC9] rounded-md px-3 py-1.5 font-geist text-[#111111] bg-white focus:outline-none">
            <option>Sort by: Ending Soon</option>
            <option>Sort by: Price (Low to High)</option>
            <option>Sort by: Price (High to Low)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Link href={`/auctions/${i}`} key={i} className="flex flex-col w-full bg-white border border-[#CBCCC9] rounded-xl overflow-hidden shadow-sm hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="h-48 bg-[#E7E8E5] w-full" />
              <div className="p-4 flex flex-col gap-2">
                 <h3 className="font-jetbrains font-bold text-lg text-[#111111]">Auction Item {i}</h3>
                 <p className="font-geist text-sm text-[#666666]">{0.5 * i} ETH</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
