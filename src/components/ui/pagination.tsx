'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    /** Optional summary text to render on the left, e.g. "1–20 de 77" */
    summary?: string;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    summary,
    className = '',
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = buildPageList(currentPage, totalPages);

    const go = (p: number) => {
        if (p < 1 || p > totalPages || p === currentPage) return;
        onPageChange(p);
    };

    return (
        <div className={`flex items-center justify-between gap-2 ${className}`}>
            {summary && <p className="text-xs text-gray-500 dark:text-gray-400">{summary}</p>}
            <div className="flex items-center gap-1 ml-auto">
                <NavButton onClick={() => go(currentPage - 1)} disabled={currentPage === 1} aria-label="Anterior">
                    <ChevronLeft className="w-4 h-4" />
                </NavButton>
                {pages.map((p, i) =>
                    p === '…' ? (
                        <span key={`gap-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => go(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                p === currentPage
                                    ? 'bg-[#505A4A] text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {p}
                        </button>
                    )
                )}
                <NavButton onClick={() => go(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Siguiente">
                    <ChevronRight className="w-4 h-4" />
                </NavButton>
            </div>
        </div>
    );
}

function NavButton({
    onClick,
    disabled,
    children,
    'aria-label': ariaLabel,
}: {
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
    'aria-label': string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
            {children}
        </button>
    );
}

/**
 * Build a page list with ellipsis: 1, ..., current-1, current, current+1, ..., last.
 * Always shows first and last page; surrounds current with neighbors when there's space.
 */
function buildPageList(current: number, total: number): (number | '…')[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const result: (number | '…')[] = [1];
    if (current > 3) result.push('…');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let p = start; p <= end; p++) result.push(p);
    if (current < total - 2) result.push('…');
    result.push(total);
    return result;
}
