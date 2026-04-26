'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

interface LoadingContextType {
    /** True when at least one operation is loading */
    isLoading: boolean;
    /** Set of active loading operation keys */
    activeKeys: string[];
    /** Register a loading operation. Call stopLoading(key) when done. */
    startLoading: (key: string) => void;
    /** Unregister a loading operation. */
    stopLoading: (key: string) => void;
    /** Helper that wraps an async function with loading state. */
    withLoading: <T>(key: string, fn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [activeKeysSet, setActiveKeysSet] = useState<Set<string>>(new Set());

    const startLoading = useCallback((key: string) => {
        setActiveKeysSet(prev => {
            if (prev.has(key)) return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    }, []);

    const stopLoading = useCallback((key: string) => {
        setActiveKeysSet(prev => {
            if (!prev.has(key)) return prev;
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
    }, []);

    const withLoading = useCallback(async <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
        startLoading(key);
        try {
            return await fn();
        } finally {
            stopLoading(key);
        }
    }, [startLoading, stopLoading]);

    const value = useMemo<LoadingContextType>(() => ({
        isLoading: activeKeysSet.size > 0,
        activeKeys: Array.from(activeKeysSet),
        startLoading,
        stopLoading,
        withLoading,
    }), [activeKeysSet, startLoading, stopLoading, withLoading]);

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading() {
    const ctx = useContext(LoadingContext);
    if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
    return ctx;
}
