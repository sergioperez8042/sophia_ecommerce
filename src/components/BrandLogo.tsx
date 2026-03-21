"use client";

import { m } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  linkTo?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

const textSizeMap = {
  sm: { title: 'text-lg', subtitle: 'text-[10px]' },
  md: { title: 'text-2xl', subtitle: 'text-xs' },
  lg: { title: 'text-3xl', subtitle: 'text-xs' },
};

export default function BrandLogo({ size = 'md', showText = true, linkTo, animated = true }: BrandLogoProps) {
  const content = (
    <div className={`flex ${showText ? 'flex-col items-center gap-3' : ''}`}>
      <m.div
        className={`${sizeMap[size]} relative rounded-2xl overflow-hidden shadow-md`}
        initial={animated ? { scale: 0.8, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
      >
        <Image
          src="/images/sophia_logo_nuevo.jpeg"
          alt="Sophia"
          fill
          sizes="80px"
          className="object-cover"
        />
      </m.div>
      {showText && (
        <div className="text-center">
          <m.h1
            className={`${textSizeMap[size].title} font-semibold text-[#2c3026] tracking-wide`}
            style={{ fontFamily: 'Cinzel, serif' }}
            initial={animated ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Sophia
          </m.h1>
          {/* Subtitle removed — brand is just "Sophia" */}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return <Link href={linkTo} className="inline-flex">{content}</Link>;
  }

  return content;
}
