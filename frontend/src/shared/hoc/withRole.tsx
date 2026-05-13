'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@prisma/client';

export function withRole(Component: React.ComponentType, allowedRoles: Role[]) {
  return function ProtectedRoute(props: any) {
    const { user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      if (_hasHydrated) {
        if (!user || !allowedRoles.includes(user.role)) {
          router.replace('/');
        } else {
          setIsAuthorized(true);
        }
      }
    }, [_hasHydrated, user, router]);

    if (!_hasHydrated || !isAuthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#F2F3F0]">
          <div className="animate-pulse font-jetbrains text-[#004D1A]">Verifying permissions...</div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
