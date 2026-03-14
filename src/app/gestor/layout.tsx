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
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="w-6 h-6 animate-spin text-[#505A4A]" />
      </div>
    );
  }

  if (!isAuthenticated || !isManager) {
    return null;
  }

  return <>{children}</>;
}
