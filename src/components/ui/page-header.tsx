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

const BACK_BUTTON_CLASS = 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors';

function BackButton({ href, onClick }: { href?: string; onClick?: () => void }) {
    if (href) {
        return (
            <Link href={href} className={BACK_BUTTON_CLASS} aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
            </Link>
        );
    }
    return (
        <button type="button" onClick={onClick} className={BACK_BUTTON_CLASS} aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
        </button>
    );
}

export default function PageHeader({ title, subtitle, backHref, onBack, action }: PageHeaderProps) {
    const showBack = Boolean(backHref || onBack);

    return (
        <div className="flex items-start justify-between gap-3 mb-6">
            <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {showBack ? <BackButton href={backHref} onClick={onBack} /> : null}
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                        {title}
                    </h1>
                </div>
                {subtitle ? (
                    <p className={`text-sm text-gray-500 dark:text-gray-400 ${showBack ? 'ml-7' : ''}`}>
                        {subtitle}
                    </p>
                ) : null}
            </div>
            {action ? <div className="flex-shrink-0">{action}</div> : null}
        </div>
    );
}
