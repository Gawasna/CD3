import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/auth/ToastContainer";
import { Web3Provider } from "@/contexts/WagmiProvider";
import ChatWidget from "@/components/ui/ChatWidget";
import { QueryProvider } from "@/contexts/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biddee",
  description: "C2C Auction Blockchain Platform. Transparent, Fast, Secure.",
  other: {
    // Chặn Google Translate tự động popup
    'google': 'notranslate',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      translate="no"
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="min-h-full flex flex-col font-geist" suppressHydrationWarning>
        <Web3Provider>
          <QueryProvider>
            <NextIntlClientProvider messages={messages}>
              <ToastProvider>
                <Header />
                {children}
                <Footer />
                {/* Chat support widget - hiển thị toàn cục */}
                <ChatWidget />
              </ToastProvider>
            </NextIntlClientProvider>
          </QueryProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
