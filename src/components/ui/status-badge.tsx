'use client';

import { ReactNode } from 'react';

type Variant = 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

interface StatusBadgeProps {
    variant?: Variant;
    size?: 'xs' | 'sm';
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    accent: 'bg-[#505A4A]/10 text-[#505A4A] dark:bg-[#505A4A]/20 dark:text-[#b8b0a2]',
};

const SIZE_CLASSES = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
};

export default function StatusBadge({
    variant = 'neutral',
    size = 'sm',
    icon,
    children,
    className = '',
}: StatusBadgeProps) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}>
            {icon}
            {children}
        </span>
    );
}
