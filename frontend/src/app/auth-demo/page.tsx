'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AuthDemoPage - Disabled
 * This route is no longer accessible and will redirect to the home page.
 */
export default function AuthDemoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
