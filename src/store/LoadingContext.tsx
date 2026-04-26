'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

export const LOADING_KEYS = {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    AUTH: 'auth',
} as const;

export type LoadingKey = typeof LOADING_KEYS[keyof typeof LOADING_KEYS] | string;

interface LoadingContextType {
    isLoading: boolean;
    startLoading: (key: LoadingKey) => void;
    stopLoading: (key: LoadingKey) => void;
    withLoading: <T>(key: LoadingKey, fn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [activeKeys, setActiveKeys] = useState<Set<string>>(() => new Set());

    const startLoading = useCallback((key: LoadingKey) => {
        setActiveKeys(prev => {
            if (prev.has(key)) return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    }, []);

    const stopLoading = useCallback((key: LoadingKey) => {
        setActiveKeys(prev => {
            if (!prev.has(key)) return prev;
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
    }, []);

    const withLoading = useCallback(async <T,>(key: LoadingKey, fn: () => Promise<T>): Promise<T> => {
        startLoading(key);
        try { return await fn(); }
        finally { stopLoading(key); }
    }, [startLoading, stopLoading]);

    const value = useMemo<LoadingContextType>(() => ({
        isLoading: activeKeys.size > 0,
        startLoading,
        stopLoading,
        withLoading,
    }), [activeKeys, startLoading, stopLoading, withLoading]);

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading() {
    const ctx = useContext(LoadingContext);
    if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
    return ctx;
}
