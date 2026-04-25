'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

// Registration is the same as login for wallet-based auth
export default function RegisterPage() {
  useEffect(() => {
    redirect('/login');
  }, []);

  return null;
}
