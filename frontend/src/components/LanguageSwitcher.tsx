'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

export default function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (locale: Locale) => {
    // Lưu locale vào cookie
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Refresh trang để áp dụng ngôn ngữ mới
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-[#CBCCC9] bg-white hover:bg-[#F2F3F0] transition-colors"
        aria-label="Change language"
        title={localeNames[currentLocale]}
      >
        <Globe className="w-5 h-5 text-[#666666]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#CBCCC9] rounded-xl shadow-lg overflow-hidden z-50">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                locale === currentLocale
                  ? 'bg-[#FF8400] text-white'
                  : 'text-[#111111] hover:bg-[#F2F3F0]'
              }`}
            >
              <span className="text-2xl leading-none">{localeFlags[locale]}</span>
              <span className="font-geist text-sm font-medium">
                {localeNames[locale]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
