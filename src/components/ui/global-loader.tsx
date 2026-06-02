'use client';

import { useEffect, useState } from 'react';
import { useLoadingState } from '@/store/LoadingContext';

const FADE_OUT_MS = 300;

export default function GlobalLoader() {
    const { isLoading } = useLoadingState();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            return;
        }
        const t = setTimeout(() => setVisible(false), FADE_OUT_MS);
        return () => clearTimeout(t);
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden pointer-events-none"
            role="progressbar"
            aria-label="Cargando"
            aria-busy={isLoading}
        >
            <div
                className={`h-full bg-gradient-to-r from-[#2E4A3A] via-[#7a8a72] to-[#2E4A3A] shadow-[0_0_8px_rgba(46, 74, 58,0.5)] ${
                    isLoading ? 'animate-loading-bar' : 'w-full opacity-0 transition-opacity duration-300'
                }`}
            />
        </div>
    );
}
