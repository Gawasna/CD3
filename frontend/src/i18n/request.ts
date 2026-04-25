import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  
  // Ưu tiên: cookie > default locale
  const locale = localeCookie && locales.includes(localeCookie) 
    ? localeCookie 
    : defaultLocale;

  // Lazy load messages theo module - chỉ load ngôn ngữ cần thiết
  let messages;
  
  if (locale === 'vi') {
    const getMessages = (await import(`../messages/vi/index`)).default;
    messages = await getMessages();
  } else if (locale === 'en') {
    const getMessages = (await import(`../messages/en/index`)).default;
    messages = await getMessages();
  }

  return {
    locale,
    messages,
  };
});
