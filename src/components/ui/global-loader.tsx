'use client';

import { useEffect, useState } from 'react';
import { useLoading } from '@/store/LoadingContext';

/**
 * Top progress bar shown when any global loading operation is active.
 * Uses indeterminate animation when active, transitions to 100% before fading out.
 */
export default function GlobalLoader() {
    const { isLoading } = useLoading();
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            setProgress(15);
            // Simulate progress: jump to 30, then crawl up to ~85
            const t1 = setTimeout(() => setProgress(35), 80);
            const t2 = setTimeout(() => setProgress(60), 300);
            const t3 = setTimeout(() => setProgress(80), 1000);
            const interval = setInterval(() => {
                setProgress(p => (p < 90 ? p + 0.5 : p));
            }, 200);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
                clearInterval(interval);
            };
        } else if (visible) {
            // Complete and fade out
            setProgress(100);
            const fade = setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 300);
            return () => clearTimeout(fade);
        }
    }, [isLoading, visible]);

    if (!visible) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none"
            role="progressbar"
            aria-label="Cargando"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div
                className="h-full bg-gradient-to-r from-[#505A4A] via-[#7a8a72] to-[#505A4A] shadow-[0_0_8px_rgba(80,90,74,0.5)] transition-[width,opacity] duration-300 ease-out"
                style={{
                    width: `${progress}%`,
                    opacity: progress === 100 ? 0 : 1,
                }}
            />
        </div>
    );
}
