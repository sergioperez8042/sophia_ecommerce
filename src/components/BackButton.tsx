"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-[#505A4A] hover:text-[#414A3C] transition-colors mb-8"
    >
      <ArrowLeft className="w-4 h-4" />
      Volver
    </button>
  );
}
