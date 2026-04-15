import Link from 'next/link';

export default function Homepage() {
  return (
    <div className="flex flex-col gap-12 p-8 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-6 p-20 bg-white rounded-2xl border border-[#CBCCC9] w-full">
        <h1 className="text-center font-jetbrains text-5xl font-extrabold text-[#111111]">
          Discover Unique Assets & Vintage Items
        </h1>
        <p className="text-center font-geist text-lg text-[#666666]">
          P2P Auction Blockchain Platform. Transparent, Fast, Secure.
        </p>
        <Link href="/auctions" className="flex items-center justify-center h-10 px-6 py-2 gap-1.5 bg-[#FF8400] rounded-full text-[#111111] font-jetbrains text-base font-medium hover:opacity-90 transition-opacity">
          Explore Auctions
        </Link>
      </section>

      {/* Trending Section */}
      <section className="flex flex-col gap-6 w-full">
        <div className="flex justify-between items-end w-full">
          <h2 className="font-jetbrains text-2xl font-bold text-[#111111]">Ending Soon</h2>
          <Link href="/auctions" className="font-jetbrains text-sm font-semibold text-[#FF8400] hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {[1, 2, 3, 4].map((i) => (
            <Link href={`/auctions/${i}`} key={i} className="flex flex-col w-full bg-white border border-[#CBCCC9] rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="h-48 bg-[#E7E8E5] w-full" />
              <div className="p-4 flex flex-col gap-2">
                <h3 className="font-jetbrains font-bold text-lg text-[#111111]">Trending Item {i}</h3>
                <p className="font-geist text-sm text-[#666666]">Current bid: {0.5 * i} ETH</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
