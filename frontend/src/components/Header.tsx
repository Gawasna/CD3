import Link from 'next/link';
import { Box, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between h-[72px] px-8 bg-[#F2F3F0] border-b border-[#CBCCC9]">
      <div className="flex items-center gap-3">
        <Box className="w-8 h-8 text-[#FF8400]" />
        <Link href="/" className="font-jetbrains text-[22px] font-extrabold tracking-wide text-[#111111]">
          P2P AUCTION
        </Link>
      </div>

      <div className="flex items-center gap-2 h-10 px-4 rounded-full border border-[#CBCCC9] w-[400px]">
        <Search className="w-5 h-5 text-[#666666]" />
        <input 
          type="text" 
          placeholder="Search for items, collections..." 
          className="bg-transparent border-none outline-none w-full font-geist text-sm text-[#111111] placeholder:text-[#666666]"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center justify-center h-10 px-4 py-2 bg-[#FF8400] rounded-full text-[#111111] font-jetbrains text-sm font-medium hover:bg-[#e07500] transition-colors">
          Connect Wallet
        </button>
      </div>
    </header>
  );
}
