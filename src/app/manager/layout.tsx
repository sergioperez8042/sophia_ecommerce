"use client";

import { useEffect } from 'react';
import { useAuth } from '@/store';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GestorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded, isAuthenticated, isManager } = useAuth();

  useEffect(() => {
    if (isLoaded && (!isAuthenticated || !isManager)) {
      router.push('/auth');
    }
  }, [isLoaded, isAuthenticated, isManager, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !isManager) {
    return null;
  }

  return <>{children}</>;
}
