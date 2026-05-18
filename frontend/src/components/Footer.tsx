"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, ExternalLink, Globe } from "lucide-react";

export default function Footer() {
  const t = useTranslations("common.footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t-2 border-[#CBCCC9] mt-auto">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="flex flex-col gap-4 col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#111111] rounded-xl flex items-center justify-center">
                <span className="text-white font-jetbrains font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold text-[#111111] font-jetbrains tracking-tight uppercase">
                Biddee
              </span>
            </Link>
            <p className="text-[#666666] text-sm leading-relaxed max-w-xs">
              The next generation C2C auction platform powered by blockchain technology. Transparent, fast, and secure.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="w-9 h-9 rounded-lg border-2 border-[#CBCCC9] flex items-center justify-center text-[#666666] hover:border-[#FF8400] hover:text-[#FF8400] transition-all">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg border-2 border-[#CBCCC9] flex items-center justify-center text-[#666666] hover:border-[#FF8400] hover:text-[#FF8400] transition-all">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider font-jetbrains">{t('marketplace')}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/explore" className="text-sm text-[#666666] hover:text-[#FF8400] transition-colors">All Auctions</Link>
              <Link href="/explore?status=live" className="text-sm text-[#666666] hover:text-[#FF8400] transition-colors">Live Auctions</Link>
              <Link href="/explore?status=ending_soon" className="text-sm text-[#666666] hover:text-[#FF8400] transition-colors">Ending Soon</Link>
              <Link href="/create-auction" className="text-sm text-[#666666] hover:text-[#FF8400] transition-colors">Sell Items</Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider font-jetbrains">{t('resources')}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/help" className="text-sm text-[#666666] hover:text-[#FF8400] transition-colors">Help Center</Link>
              <Link href="/terms" className="text-sm text-[#666666] hover:text-[#FF8400] transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="text-sm text-[#666666] hover:text-[#FF8400] transition-colors">Privacy Policy</Link>
              <a href="#" className="text-sm text-[#666666] hover:text-[#FF8400] transition-colors flex items-center gap-1">
                Smart Contract <ExternalLink className="w-3 h-3" />
              </a>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider font-jetbrains">{t('stayUpdated')}</h4>
            <p className="text-sm text-[#666666]">Join our newsletter to get latest updates on auctions.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address"
                className="flex-1 px-4 py-2 rounded-xl border-2 border-[#CBCCC9] text-sm focus:border-[#FF8400] outline-none transition-colors"
              />
              <button className="px-4 py-2 bg-[#111111] text-white text-sm font-bold rounded-xl hover:bg-[#FF8400] transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#F2F3F0] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#999999]">
            © {currentYear} Biddee Platform. Built with passion on Blockchain.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-widest">Network Live</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
