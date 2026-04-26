'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

export const LOADING_KEYS = {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    AUTH: 'auth',
} as const;

export type LoadingKey = typeof LOADING_KEYS[keyof typeof LOADING_KEYS] | string;

interface LoadingState {
    isLoading: boolean;
}

interface LoadingActions {
    startLoading: (key: LoadingKey) => void;
    stopLoading: (key: LoadingKey) => void;
    withLoading: <T>(key: LoadingKey, fn: () => Promise<T>) => Promise<T>;
}

const LoadingStateContext = createContext<LoadingState | undefined>(undefined);
const LoadingActionsContext = createContext<LoadingActions | undefined>(undefined);

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

    // Actions are stable forever (callbacks have empty deps); memo prevents object re-creation
    const actions = useMemo<LoadingActions>(
        () => ({ startLoading, stopLoading, withLoading }),
        [startLoading, stopLoading, withLoading]
    );

    // State only changes when the boolean flips, not on every Set mutation
    const isLoading = activeKeys.size > 0;
    const state = useMemo<LoadingState>(() => ({ isLoading }), [isLoading]);

    return (
        <LoadingActionsContext.Provider value={actions}>
            <LoadingStateContext.Provider value={state}>
                {children}
            </LoadingStateContext.Provider>
        </LoadingActionsContext.Provider>
    );
}

/** Subscribes to loading state — re-renders only when isLoading flips. */
export function useLoadingState() {
    const ctx = useContext(LoadingStateContext);
    if (!ctx) throw new Error('useLoadingState must be used within LoadingProvider');
    return ctx;
}

/** Returns stable action callbacks — never causes re-renders by itself. */
export function useLoadingActions() {
    const ctx = useContext(LoadingActionsContext);
    if (!ctx) throw new Error('useLoadingActions must be used within LoadingProvider');
    return ctx;
}

/** Combined hook for callers that need both. Prefer the split hooks above when possible. */
export function useLoading() {
    return { ...useLoadingState(), ...useLoadingActions() };
}
