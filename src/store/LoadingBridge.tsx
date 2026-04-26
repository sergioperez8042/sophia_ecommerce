'use client';

import { useEffect } from 'react';
import { useLoading } from './LoadingContext';
import { useProducts } from './ProductContext';
import { useCategories } from './CategoryContext';
import { useAuth } from './AuthContext';

/**
 * Bridges existing context isLoading flags into the global LoadingContext.
 * Mount once near the root, after the relevant providers.
 */
export default function LoadingBridge() {
    const { startLoading, stopLoading } = useLoading();
    const { isLoading: productsLoading } = useProducts();
    const { isLoading: categoriesLoading } = useCategories();
    const { isLoaded: authLoaded } = useAuth();

    useEffect(() => {
        if (productsLoading) startLoading('products');
        else stopLoading('products');
    }, [productsLoading, startLoading, stopLoading]);

    useEffect(() => {
        if (categoriesLoading) startLoading('categories');
        else stopLoading('categories');
    }, [categoriesLoading, startLoading, stopLoading]);

    useEffect(() => {
        if (!authLoaded) startLoading('auth');
        else stopLoading('auth');
    }, [authLoaded, startLoading, stopLoading]);

    return null;
}
