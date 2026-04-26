'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    onBack?: () => void;
    action?: ReactNode;
}

export default function PageHeader({ title, subtitle, backHref, onBack, action }: PageHeaderProps) {
    const showBack = backHref || onBack;

    return (
        <div className="flex items-start justify-between gap-3 mb-6">
            <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {showBack && (
                        backHref ? (
                            <Link
                                href={backHref}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                aria-label="Volver"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={onBack}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                aria-label="Volver"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                        {title}
                    </h1>
                </div>
                {subtitle && (
                    <p className={`text-sm text-gray-500 dark:text-gray-400 ${showBack ? 'ml-7' : ''}`}>
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
    );
}
